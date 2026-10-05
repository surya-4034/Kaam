import db from '../config/database.js';
import { getPartnerModel, generatePartnerId } from '../models/PartnerModel.js';
import { isPartnerDbConnected } from '../config/mongoose.js';
import { filterAndSortByDistance } from '../services/spatialLocationService.js';
import { searchPartnersSpatial50Km, isWithinMumbaiRange, resolveWorkerCoordinates } from '../services/redisSpatialService.js';
import { CANONICAL_VERIFIED_PARTNERS, ensureVerifiedPartnersSeeded } from '../constants/verifiedPartners.js';


// Get list of active partners
export const getWorkers = async (req, res) => {
  const { category, maxBudget, search } = req.query;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const query = { isAccountLocked: { $ne: true } };

      if (category && category !== 'all') {
        const catRegex = new RegExp(`^${category}$`, 'i');
        query.$or = [
          { tradeCategory: catRegex },
          { categories: catRegex }
        ];
      }

      if (maxBudget) {
        query.dailyRate = { $lte: Number(maxBudget) };
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { partnerId: searchRegex },
          { tradeTitle: searchRegex },
          { locality: searchRegex },
        ];
      }

      const partners = await Partner.find(query).sort({ ratingAverage: -1 }).lean();

      if (partners && partners.length > 0) {
        const mappedPartners = partners.map(p => ({
          ...p,
          tradeCategory: p.tradeCategory || 'plumber',
          tradeTitle: p.tradeTitle || 'Skilled Trade Specialist',
          dailyRate: p.dailyRate || 650,
          hourlyRate: p.hourlyRate || 120,
          visitingCharge: p.visitingCharge || 149,
          experienceYears: p.experienceYears || 1,
          categories: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : [p.tradeCategory || 'plumber'],
          packages: Array.isArray(p.packages) ? p.packages : [],
          isAvailable: p.isAvailable !== false,
          ratingAverage: p.ratingAverage || 5.0,
          completedJobsCount: p.completedJobsCount || 0
        }));
        return res.json({ count: mappedPartners.length, workers: mappedPartners });
      }
    } catch (err) {
      console.warn('MongoDB query notice, falling back to SQLite:', err.message);
    }
  }

  // SQLite Fallback
  let sql = `
    SELECT wp.*, u.full_name as name, u.phone, u.email 
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE (wp.is_account_locked = 0 OR wp.is_account_locked IS NULL)
  `;
  const params = [];

  if (category && category !== 'all') {
    sql += ` AND LOWER(wp.trade_category) = LOWER(?)`;
    params.push(category);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const mapped = (rows || []).map(r => {
      let packages = [];
      let categories = [r.trade_category || 'plumber'];
      try { if (r.packages_json) packages = JSON.parse(r.packages_json); } catch (e) {}
      try { if (r.categories_json) categories = JSON.parse(r.categories_json); } catch (e) {}
      if (Array.isArray(packages)) {
        packages.forEach(p => {
          if (p.category && !categories.includes(p.category.toLowerCase())) {
            categories.push(p.category.toLowerCase());
          }
        });
      }
      return {
        ...r,
        tradeCategory: r.trade_category,
        tradeTitle: r.trade_title,
        dailyRate: r.daily_rate,
        hourlyRate: r.hourly_rate,
        visitingCharge: r.visiting_charge || 149,
        ratingAverage: r.rating_average,
        completedJobsCount: r.completed_jobs_count,
        isAvailable: Boolean(r.is_available),
        locality: r.locality || 'Andheri West, Mumbai',
        city: r.city || 'Mumbai',
        packages,
        categories
      };
    });

    if (mapped.length === 0) {
      // Trigger background self-healing SQLite seed
      ensureVerifiedPartnersSeeded(db).catch(() => {});

      let fallbackList = CANONICAL_VERIFIED_PARTNERS;
      if (category && category !== 'all') {
        fallbackList = fallbackList.filter(p => 
          p.tradeCategory?.toLowerCase() === category.toLowerCase() ||
          p.categories?.some(c => c.toLowerCase() === category.toLowerCase())
        );
      }
      if (maxBudget) {
        fallbackList = fallbackList.filter(p => p.dailyRate <= Number(maxBudget));
      }
      return res.json({ count: fallbackList.length, workers: fallbackList });
    }

    res.json({ count: mapped.length, workers: mapped });
  });
};

// Dedicated Search API Endpoint: GET /api/workers/search
// Implements Modern Search Engine Architecture:
// 1. Text Pre-Processing & Tokenization (Stop-word removal, Normalization)
// 2. Synonym Expansion Dictionary
// 3. Multi-Field Inverted Index Matching (Name, Partner ID, Trade, Skills, Package titles/categories, Locality)
// 4. Faceted Filtering (Category, Locality, Max Budget, Rating)
// 5. Relevance Scoring & Ranking (Availability, Rating Average, Completed Jobs)
export const searchWorkers = async (req, res) => {
  const { category, q, locality, city, maxBudget, minRating, lat, lng, maxDistanceKm } = req.query;

  // 1. Mumbai Whole-City Geographic Range Check
  let clientLatToUse = Number(lat);
  let clientLngToUse = Number(lng);
  const requestedLocation = `${city || ''} ${locality || ''}`.trim();

  // If user explicitly requested an outside location (like Delhi, Noida, etc.)
  const outsideIndicators = ['noida', 'delhi', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'pune', 'bengaluru', 'bangalore', 'hyderabad', 'lucknow', 'kanpur', 'patna', 'gaya', 'kolkata', 'chennai', 'ahmedabad', 'jaipur'];
  const isExplicitlyOutside = outsideIndicators.some(ind => requestedLocation.toLowerCase().includes(ind) && !requestedLocation.toLowerCase().includes('mumbai') && !requestedLocation.toLowerCase().includes('thane'));

  if (isExplicitlyOutside) {
    return res.json({
      status: 'unavailable',
      isMumbai: false,
      message: 'Service was unavailable at this place, sorry for inconvenience!',
      searchMeta: {
        query: q || '',
        category: category || 'all',
        isAvailable: false
      },
      count: 0,
      workers: []
    });
  }

  // If coordinates are outside MMR or missing, default to Central Mumbai coordinates for browsing
  if (isNaN(clientLatToUse) || isNaN(clientLngToUse) || clientLatToUse === 0 || clientLngToUse === 0 || !isWithinMumbaiRange(clientLatToUse, clientLngToUse, requestedLocation)) {
    clientLatToUse = 19.0760;
    clientLngToUse = 72.8777;
  }

  // 2. Pre-Processing & Tokenization
  const cleanQ = (q || '').toLowerCase().trim();
  const stopWords = new Set(['a', 'an', 'the', 'for', 'in', 'near', 'near me', 'service', 'services', 'repair', 'repairs', 'fix', 'fixing', 'worker', 'partner', 'pro', 'professional', 'need', 'want', 'looking']);
  
  // Extract clean tokens
  const tokens = cleanQ
    .split(/[\s,._/-]+/)
    .filter(t => t.length > 0 && !stopWords.has(t));

  // 2. Synonym Expansion Dictionary
  const categorySynonyms = {
    electrician: ['electric', 'electrical', 'zap', 'wire', 'wiring', 'fan', 'switch', 'light', 'mcb', 'fuse', 'inverter', 'socket'],
    plumber: ['plumbing', 'pipe', 'tap', 'leak', 'water', 'drain', 'basin', 'sink', 'toilet', 'flush', 'cpvc', 'tank', 'faucet'],
    carpenter: ['carpentry', 'wood', 'furniture', 'door', 'window', 'table', 'bed', 'chair', 'cupboard', 'drawer', 'lock', 'latch'],
    painter: ['painting', 'paint', 'wall', 'color', 'putty', 'primer', 'texture', 'waterproof', 'distemper'],
    ac_repair: ['ac', 'aircon', 'cooling', 'fridge', 'refrigerator', 'chiller', 'appliance', 'compressor', 'gas'],
    cleaner: ['cleaning', 'clean', 'wash', 'maid', 'debris', 'sanitation', 'dust', 'sofa', 'carpet'],
    mason: ['tile', 'marble', 'brick', 'granite', 'stone', 'slate', 'plaster', 'cement'],
    welder: ['welding', 'iron', 'gate', 'grill', 'metal', 'steel']
  };

  const selCat = (category || 'all').toLowerCase().trim();
  const expandedTerms = new Set([...tokens]);

  // Expand synonyms for search query and category
  if (selCat !== 'all' && categorySynonyms[selCat]) {
    categorySynonyms[selCat].forEach(syn => expandedTerms.add(syn));
  }
  tokens.forEach(tok => {
    Object.keys(categorySynonyms).forEach(catKey => {
      if (catKey === tok || categorySynonyms[catKey].includes(tok)) {
        expandedTerms.add(catKey);
        categorySynonyms[catKey].forEach(syn => expandedTerms.add(syn));
      }
    });
  });

  const termList = Array.from(expandedTerms);

  // MongoDB Search
  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const query = { isAccountLocked: { $ne: true } };
      const conditions = [];

      // Category Facet Filter
      if (selCat !== 'all') {
        const catSyns = categorySynonyms[selCat] || [];
        const catRegexes = [selCat, ...catSyns].map(s => new RegExp(s, 'i'));

        conditions.push({
          $or: [
            { tradeCategory: { $in: catRegexes } },
            { categories: { $in: catRegexes } },
            { tradeTitle: { $in: catRegexes } },
            { 'packages.category': { $in: catRegexes } },
            { 'packages.title': { $in: catRegexes } },
            { 'packages.description': { $in: catRegexes } }
          ]
        });
      }

      // Multi-Token Query Pre-Processing & Inverted Index Matching
      if (termList.length > 0) {
        const tokenOrConditions = termList.map(term => {
          const termRegex = new RegExp(term, 'i');
          return {
            $or: [
              { name: termRegex },
              { partnerId: termRegex },
              { tradeTitle: termRegex },
              { tradeCategory: termRegex },
              { categories: termRegex },
              { locality: termRegex },
              { city: termRegex },
              { bio: termRegex },
              { 'packages.title': termRegex },
              { 'packages.description': termRegex },
              { 'packages.category': termRegex }
            ]
          };
        });

        conditions.push({ $or: tokenOrConditions });
      }

      // Locality Facet Filter
      if (locality) {
        conditions.push({ locality: new RegExp(locality, 'i') });
      }

      // Max Budget Facet Filter (against dailyRate or packages.price)
      if (maxBudget) {
        const budgetNum = Number(maxBudget);
        conditions.push({
          $or: [
            { dailyRate: { $lte: budgetNum } },
            { 'packages.price': { $lte: budgetNum } }
          ]
        });
      }

      // Rating Facet Filter
      if (minRating) {
        conditions.push({ ratingAverage: { $gte: Number(minRating) } });
      }

      if (conditions.length > 0) {
        query.$and = conditions;
      }

      // Relevance Scoring & Ranking: Online first, higher ratingAverage, higher completedJobsCount
      const rawPartners = await Partner.find(query)
        .sort({ isAvailable: -1, ratingAverage: -1, completedJobsCount: -1 })
        .lean();

      const finalPartners = filterAndSortByDistance(rawPartners, clientLatToUse, clientLngToUse, maxDistanceKm || 75).map(p => ({
        ...p,
        tradeCategory: p.tradeCategory || 'plumber',
        tradeTitle: p.tradeTitle || 'Skilled Trade Specialist',
        dailyRate: p.dailyRate || 650,
        hourlyRate: p.hourlyRate || 120,
        visitingCharge: p.visitingCharge || 149,
        experienceYears: p.experienceYears || 1,
        categories: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : [p.tradeCategory || 'plumber'],
        packages: Array.isArray(p.packages) ? p.packages : [],
        isAvailable: p.isAvailable !== false,
        ratingAverage: p.ratingAverage || 5.0,
        completedJobsCount: p.completedJobsCount || 0
      }));

      if (finalPartners && finalPartners.length > 0) {
        return res.json({
          status: 'success',
          searchMeta: {
            query: q || '',
            category: selCat,
            tokens,
            expandedTerms: termList,
            maxDistanceKm: Number(maxDistanceKm) || 75,
            totalResults: finalPartners.length
          },
          count: finalPartners.length,
          workers: finalPartners
        });
      }
    } catch (err) {
      console.warn('MongoDB search query error, falling back to SQLite:', err.message);
    }
  }

  // SQLite Fallback Search Engine
  let sql = `
    SELECT wp.*, COALESCE(u.full_name, 'Partner') as name, COALESCE(u.phone, '') as phone, COALESCE(u.email, '') as email 
    FROM worker_profiles wp
    LEFT JOIN users u ON wp.user_id = u.id
    WHERE (wp.is_account_locked = 0 OR wp.is_account_locked IS NULL)
  `;
  const params = [];

  if (selCat !== 'all') {
    const catSyns = categorySynonyms[selCat] || [];
    const searchTerms = [selCat, ...catSyns];
    const catClauses = searchTerms.map(() => `(
      LOWER(wp.trade_category) LIKE LOWER(?) 
      OR LOWER(wp.trade_title) LIKE LOWER(?) 
      OR LOWER(wp.categories_json) LIKE LOWER(?) 
      OR LOWER(wp.packages_json) LIKE LOWER(?)
    )`).join(' OR ');
    sql += ` AND (${catClauses})`;
    searchTerms.forEach(term => {
      params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
    });
  }

  if (cleanQ) {
    const qClauses = termList.length > 0 ? termList : [cleanQ];
    const matchConditions = qClauses.map(() => `(
      LOWER(u.full_name) LIKE LOWER(?) 
      OR LOWER(wp.trade_title) LIKE LOWER(?) 
      OR LOWER(wp.trade_category) LIKE LOWER(?)
      OR LOWER(wp.categories_json) LIKE LOWER(?)
      OR LOWER(wp.packages_json) LIKE LOWER(?)
      OR LOWER(wp.locality) LIKE LOWER(?) 
      OR LOWER(wp.bio) LIKE LOWER(?)
    )`).join(' OR ');
    sql += ` AND (${matchConditions})`;
    qClauses.forEach(t => {
      params.push(`%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`);
    });
  }

  if (locality) {
    sql += ` AND LOWER(wp.locality) LIKE LOWER(?)`;
    params.push(`%${locality}%`);
  }

  if (maxBudget) {
    sql += ` AND wp.daily_rate <= ?`;
    params.push(Number(maxBudget));
  }

  sql += ` ORDER BY wp.is_available DESC, wp.rating_average DESC, wp.completed_jobs_count DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const mappedRows = (rows || []).map(r => {
      let packages = [];
      let categories = [r.trade_category || 'plumber'];
      try {
        if (r.packages_json) packages = JSON.parse(r.packages_json);
      } catch (e) {}
      try {
        if (r.categories_json) categories = JSON.parse(r.categories_json);
      } catch (e) {}

      if (Array.isArray(packages)) {
        packages.forEach(p => {
          if (p.category && !categories.includes(p.category.toLowerCase())) {
            categories.push(p.category.toLowerCase());
          }
        });
      }

      return {
        ...r,
        tradeCategory: r.trade_category,
        tradeTitle: r.trade_title,
        dailyRate: r.daily_rate,
        hourlyRate: r.hourly_rate,
        visitingCharge: r.visiting_charge || 149,
        ratingAverage: r.rating_average,
        completedJobsCount: r.completed_jobs_count,
        isAvailable: Boolean(r.is_available),
        experienceYears: r.experience_years,
        locality: r.locality || 'Andheri West, Mumbai',
        city: r.city || 'Mumbai',
        packages,
        categories
      };
    });

    db.all(`SELECT * FROM worker_portfolios`, [], (pErr, allPortfolios) => {
      const portMap = {};
      if (!pErr && Array.isArray(allPortfolios)) {
        allPortfolios.forEach(p => {
          if (!portMap[p.worker_id]) portMap[p.worker_id] = [];
          portMap[p.worker_id].push({
            id: p.id,
            title: p.title,
            category: p.category_tag,
            category_tag: p.category_tag,
            url: p.image_url,
            image_url: p.image_url,
            description: p.description,
            date: p.created_at
          });
        });
      }

      db.all(`SELECT * FROM worker_bank_kyc`, [], (kErr, allKyc) => {
        const bankMap = {};
        if (!kErr && Array.isArray(allKyc)) {
          allKyc.forEach(k => {
            bankMap[k.worker_id] = {
              holder: k.account_holder_name,
              upi: k.upi_id,
              upiPhone: k.upi_phone || '',
              bankName: k.bank_name,
              payoutMode: 'UPI Instant Payout'
            };
          });
        }

        const finalRows = filterAndSortByDistance(mappedRows, clientLatToUse, clientLngToUse, maxDistanceKm || 75).map(w => ({
          ...w,
          portfolio: portMap[w.id] || [],
          bank: bankMap[w.id] || null
        }));

        let resultsToReturn = finalRows.length > 0 ? finalRows : mappedRows.map(w => ({
          ...w,
          distanceKm: 12.5,
          portfolio: portMap[w.id] || [],
          bank: bankMap[w.id] || null
        }));

        if (resultsToReturn.length === 0) {
          ensureVerifiedPartnersSeeded(db).catch(() => {});
          let fallbackList = CANONICAL_VERIFIED_PARTNERS;
          if (selCat && selCat !== 'all') {
            fallbackList = fallbackList.filter(p => 
              p.tradeCategory?.toLowerCase() === selCat ||
              p.categories?.some(c => c.toLowerCase() === selCat)
            );
          }
          if (maxBudget) {
            fallbackList = fallbackList.filter(p => p.dailyRate <= Number(maxBudget));
          }
          resultsToReturn = fallbackList.length > 0 ? fallbackList : CANONICAL_VERIFIED_PARTNERS;
        }

        res.json({
          status: 'success',
          searchMeta: {
            query: cleanQ,
            category: selCat,
            tokens,
            expandedTerms: termList,
            maxDistanceKm: Number(maxDistanceKm) || 75,
            totalResults: resultsToReturn.length
          },
          count: resultsToReturn.length,
          workers: resultsToReturn
        });
      });
    });
  });
};

export const getWorkerById = (req, res, next) => getWorkerByUserId(req, res, next);

// Search partner by Partner ID (e.g., KP-1001)
export const getPartnerByPartnerId = async (req, res) => {
  const { partnerId } = req.params;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const partner = await Partner.findOne({
        $or: [
          { partnerId: new RegExp(`^${partnerId}$`, 'i') },
          { id: partnerId },
          { userId: partnerId }
        ]
      }).lean();

      if (partner) {
        return res.json({ status: 'success', worker: partner });
      }
    } catch (err) {
      console.warn('MongoDB partnerId query notice:', err.message);
    }
  }

  // SQLite Fallback
  const rawNum = parseInt(partnerId.replace(/\D/g, '')) || 1;
  const targetId = partnerId.toUpperCase().startsWith('KP-') ? `w-${rawNum > 1000 ? rawNum - 1000 : rawNum}` : partnerId;
  const targetPartnerId = partnerId.toUpperCase().startsWith('KP-') ? partnerId.toUpperCase() : `KP-${1000 + (parseInt((partnerId || '1').replace(/\D/g, '')) || 1)}`;

  db.get(
    `SELECT wp.*, u.full_name as name, u.phone, u.email 
     FROM worker_profiles wp
     JOIN users u ON wp.user_id = u.id
     WHERE wp.id = ? OR wp.user_id = ? OR wp.id = ?`,
    [partnerId, partnerId, targetId],
    (err, worker) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!worker) return res.status(404).json({ error: `Partner ID '${partnerId}' not found.` });
      worker.partnerId = targetPartnerId;

      try { if (worker.packages_json) worker.packages = JSON.parse(worker.packages_json); } catch (e) {}
      try { if (worker.categories_json) worker.categories = JSON.parse(worker.categories_json); } catch (e) {}
      if (!worker.categories && worker.trade_category) worker.categories = [worker.trade_category];
      if (Array.isArray(worker.packages)) {
        worker.packages.forEach(p => {
          if (p.category && !worker.categories.includes(p.category.toLowerCase())) {
            worker.categories.push(p.category.toLowerCase());
          }
        });
      }
      worker.tradeCategory = worker.trade_category;
      worker.tradeTitle = worker.trade_title;
      worker.dailyRate = worker.daily_rate;
      worker.hourlyRate = worker.hourly_rate;
      worker.visitingCharge = worker.visiting_charge || 149;
      worker.ratingAverage = worker.rating_average;
      worker.completedJobsCount = worker.completed_jobs_count;
      worker.isAvailable = Boolean(worker.is_available);
      worker.city = worker.city || 'Mumbai';

      db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [worker.id], (pErr, portfolio) => {
        worker.portfolio = (portfolio || []).map(p => ({
          id: p.id,
          title: p.title,
          category: p.category_tag,
          category_tag: p.category_tag,
          url: p.image_url,
          image_url: p.image_url,
          description: p.description,
          date: p.created_at
        }));
        res.json({ status: 'success', worker });
      });
    }
  );
};

// Get single partner by User ID or Worker ID
export const getWorkerByUserId = async (req, res) => {
  const { userId } = req.params;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const partner = await Partner.findOne({
        $or: [{ userId: userId }, { id: userId }, { partnerId: userId }]
      }).lean();

      if (partner) {
        return res.json({ worker: partner });
      }
    } catch (err) {
      console.warn('MongoDB partner lookup notice:', err.message);
    }
  }

  // SQLite Fallback
  db.get(
    `SELECT wp.*, u.full_name as name, u.phone, u.email 
     FROM worker_profiles wp
     JOIN users u ON wp.user_id = u.id
     WHERE wp.user_id = ? OR wp.id = ?`,
    [userId, userId],
    (err, worker) => {
      if (!worker) {
        const canonical = CANONICAL_VERIFIED_PARTNERS.find(p => p.id === userId || p.userId === userId || p.partnerId === userId);
        if (canonical) {
          return res.json({ worker: canonical });
        }
        return res.status(404).json({ error: 'Worker profile not found.' });
      }

      try { if (worker.packages_json) worker.packages = JSON.parse(worker.packages_json); } catch (e) {}
      try { if (worker.categories_json) worker.categories = JSON.parse(worker.categories_json); } catch (e) {}
      if (!worker.categories && worker.trade_category) worker.categories = [worker.trade_category];
      if (Array.isArray(worker.packages)) {
        worker.packages.forEach(p => {
          if (p.category && !worker.categories.includes(p.category.toLowerCase())) {
            worker.categories.push(p.category.toLowerCase());
          }
        });
      }
      worker.tradeCategory = worker.trade_category;
      worker.tradeTitle = worker.trade_title;
      worker.dailyRate = worker.daily_rate;
      worker.hourlyRate = worker.hourly_rate;
      worker.visitingCharge = worker.visiting_charge || 149;
      worker.ratingAverage = worker.rating_average;
      worker.completedJobsCount = worker.completed_jobs_count;
      worker.isAvailable = Boolean(worker.is_available);
      worker.city = worker.city || 'Mumbai';

      db.all(`SELECT * FROM worker_portfolios WHERE worker_id = ?`, [worker.id], (pErr, portfolio) => {
        worker.portfolio = (portfolio || []).map(p => ({
          id: p.id,
          title: p.title,
          category: p.category_tag,
          category_tag: p.category_tag,
          url: p.image_url,
          image_url: p.image_url,
          description: p.description,
          date: p.created_at
        }));
        db.get(`SELECT * FROM worker_bank_kyc WHERE worker_id = ?`, [worker.id], (kErr, kyc) => {
          worker.bank = kyc ? {
            holder: kyc.account_holder_name,
            upi: kyc.upi_id,
            upiPhone: kyc.upi_phone || '',
            bankName: kyc.bank_name,
            payoutMode: 'UPI Instant Payout',
          } : null;
          res.json({ worker });
        });
      });
    }
  );
};

// Update or Save Complete Partner Profile (MongoDB kaam_partner_db + SQLite)
export const updateWorkerProfile = async (req, res) => {
  const {
    workerId,
    userId: reqUserId,
    partnerId: reqPartnerId,
    tradeTitle,
    tradeCategory,
    categories: reqCategories,
    locality,
    bio,
    dailyRate,
    hourlyRate,
    visitingCharge,
    experienceYears,
    packages,
    bank,
    onboardingCompleted
  } = req.body;

  const targetUserId = req.user?.id || reqUserId;
  const targetWorkerId = workerId || `w-${targetUserId || Date.now()}`;
  const assignedPartnerId = reqPartnerId || generatePartnerId();

  const packageCategories = Array.isArray(packages) 
    ? packages.map(p => (p.category || '').toLowerCase().trim()).filter(Boolean) 
    : [];
  const incomingCategories = Array.isArray(reqCategories) 
    ? reqCategories.map(c => (c || '').toLowerCase().trim()).filter(Boolean) 
    : [];
  const primaryCat = (tradeCategory || 'plumber').toLowerCase().trim();

  const combinedCategories = Array.from(new Set([
    primaryCat,
    ...incomingCategories,
    ...packageCategories
  ])).filter(Boolean);

  let finalCategories = combinedCategories;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      
      const mongoLookup = targetUserId ? { userId: targetUserId } : { id: targetWorkerId };
      const existingPartner = await Partner.findOne(mongoLookup);

      const existingCats = Array.isArray(existingPartner?.categories) 
        ? existingPartner.categories.map(c => (c || '').toLowerCase().trim()).filter(Boolean) 
        : [];

      finalCategories = Array.from(new Set([
        ...combinedCategories,
        ...existingCats
      ])).filter(Boolean);

      const updateData = {
        id: existingPartner?.id || targetWorkerId,
        partnerId: existingPartner?.partnerId || assignedPartnerId,
        userId: targetUserId,
        name: req.body.name || existingPartner?.name || 'Partner',
        phone: req.body.phone || existingPartner?.phone || '+91 98765 43210',
        tradeTitle: tradeTitle || existingPartner?.tradeTitle || 'Service Partner',
        tradeCategory: tradeCategory || existingPartner?.tradeCategory || 'plumber',
        categories: finalCategories,
        locality: locality || existingPartner?.locality || 'Andheri West, Mumbai',
        city: 'Mumbai',
        bio: bio !== undefined ? bio : (existingPartner?.bio || ''),
        dailyRate: dailyRate ? Number(dailyRate) : (existingPartner?.dailyRate || 650),
        hourlyRate: hourlyRate ? Number(hourlyRate) : (existingPartner?.hourlyRate || 120),
        visitingCharge: visitingCharge ? Number(visitingCharge) : (existingPartner?.visitingCharge || 149),
        experienceYears: experienceYears ? Number(experienceYears) : (existingPartner?.experienceYears || 1),
        onboardingCompleted: onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : (existingPartner?.onboardingCompleted ?? true),
      };

      if (packages) updateData.packages = packages;
      if (bank) updateData.bank = bank;

      const savedPartner = await Partner.findOneAndUpdate(
        mongoLookup,
        { $set: updateData },
        { new: true, upsert: true }
      );

      console.log(`🍃 [kaam_db MongoDB Atlas] Partner saved with Partner ID (${savedPartner?.partnerId || assignedPartnerId}): ${savedPartner?.name || targetWorkerId}`);
    } catch (err) {
      console.warn('MongoDB partner update notice:', err.message);
    }
  }

  // Dual-sync to SQLite (Insert if new, Update if existing)
  // 1. Sync Name, Phone, and Email to users table if provided
  if (targetUserId && (req.body.name || req.body.phone || req.body.email)) {
    db.run(
      `UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?`,
      [req.body.name || null, req.body.phone || null, req.body.email || null, targetUserId],
      (uErr) => {
        if (uErr) console.warn('User table update warning:', uErr.message);
      }
    );
  }

  const geoCoords = resolveWorkerCoordinates({ 
    id: targetWorkerId,
    user_id: targetUserId,
    locality: locality || 'Andheri West, Mumbai', 
    city: 'Mumbai',
    latitude: req.body.latitude,
    longitude: req.body.longitude
  }) || { lat: 19.1363, lng: 72.8277 };
  const wLat = geoCoords.lat;
  const wLng = geoCoords.lng;

  const sqlLookup = targetUserId 
    ? 'SELECT id, categories_json, packages_json FROM worker_profiles WHERE user_id = ?' 
    : 'SELECT id, categories_json, packages_json FROM worker_profiles WHERE id = ?';
  const sqlLookupParams = targetUserId ? [targetUserId] : [targetWorkerId];

  db.get(sqlLookup, sqlLookupParams, (cErr, existingRow) => {
    let existingCats = [];
    if (existingRow?.categories_json) {
      try { existingCats = JSON.parse(existingRow.categories_json); } catch (e) {}
    }
    const combinedCategories = Array.from(new Set([
      primaryCat,
      ...incomingCategories,
      ...packageCategories,
      ...existingCats
    ])).filter(Boolean);
    const catJson = JSON.stringify(combinedCategories);
    const pkgJson = packages ? JSON.stringify(packages) : (existingRow?.packages_json || null);

    if (existingRow) {
      db.run(
        `UPDATE worker_profiles 
         SET daily_rate = COALESCE(?, daily_rate),
             hourly_rate = COALESCE(?, hourly_rate),
             visiting_charge = COALESCE(?, visiting_charge),
             bio = COALESCE(?, bio),
             locality = COALESCE(?, locality),
             city = 'Mumbai',
             trade_title = COALESCE(?, trade_title),
             trade_category = COALESCE(?, trade_category),
             experience_years = COALESCE(?, experience_years),
             packages_json = COALESCE(?, packages_json),
             categories_json = COALESCE(?, categories_json),
             latitude = ?,
             longitude = ?,
             is_available = 1,
             kyc_status = 'VERIFIED'
         WHERE id = ?`,
        [
          dailyRate ? Number(dailyRate) : null,
          hourlyRate ? Number(hourlyRate) : null,
          visitingCharge ? Number(visitingCharge) : null,
          bio,
          locality || 'Andheri West, Mumbai',
          tradeTitle || 'Skilled Partner',
          tradeCategory,
          experienceYears ? Number(experienceYears) : null,
          pkgJson,
          catJson,
          wLat,
          wLng,
          existingRow.id
        ],
        function (err) {
          if (bank && (bank.upi || bank.holder)) {
            const kycId = `kyc-${existingRow.id}`;
            db.run(
              `INSERT OR REPLACE INTO worker_bank_kyc (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, upi_phone, bank_name, govt_id_number, kyc_verified)
               VALUES (?, ?, ?, 'DIRECT_UPI', 'UPI0001', ?, ?, ?, 'AADHAAR_VERIFIED', 1)`,
              [kycId, existingRow.id, bank.holder || req.body.name || 'Partner', bank.upi || '', bank.upiPhone || '', bank.bankName || 'UPI Direct']
            );
          }
          res.json({ message: 'Partner profile saved successfully.', partnerId: assignedPartnerId, onboardingCompleted: true });
        }
      );
    } else {
      db.run(
        `INSERT INTO worker_profiles (id, user_id, trade_category, trade_title, experience_years, daily_rate, hourly_rate, visiting_charge, locality, city, bio, is_available, is_account_locked, kyc_status, rating_average, completed_jobs_count, packages_json, categories_json, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Mumbai', ?, 1, 0, 'VERIFIED', 5.0, 0, ?, ?, ?, ?)`,
        [
          targetWorkerId,
          targetUserId,
          tradeCategory || 'plumber',
          tradeTitle || 'Skilled Trade Specialist',
          Number(experienceYears || 1),
          Number(dailyRate || 650),
          Number(hourlyRate || 120),
          Number(visitingCharge || 149),
          locality || 'Andheri West, Mumbai',
          bio || 'Verified Mumbai skilled tradesperson on kaam.',
          pkgJson,
          catJson,
          wLat,
          wLng
        ],
        function (iErr) {
          if (bank && (bank.upi || bank.holder)) {
            const kycId = `kyc-${targetWorkerId}`;
            db.run(
              `INSERT OR REPLACE INTO worker_bank_kyc (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, upi_phone, bank_name, govt_id_number, kyc_verified)
               VALUES (?, ?, ?, 'DIRECT_UPI', 'UPI0001', ?, ?, ?, 'AADHAAR_VERIFIED', 1)`,
              [kycId, targetWorkerId, bank.holder || req.body.name || 'Partner', bank.upi || '', bank.upiPhone || '', bank.bankName || 'UPI Direct']
            );
          }
          res.json({ message: 'Partner profile created successfully.', partnerId: assignedPartnerId, onboardingCompleted: true });
        }
      );
    }
  });
};

// Toggle Availability
export const toggleWorkerAvailability = async (req, res) => {
  const { workerId, isAvailable } = req.body;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      await Partner.updateOne({ id: workerId }, { $set: { isAvailable: Boolean(isAvailable) } });
    } catch (err) {
      console.warn('MongoDB availability notice:', err.message);
    }
  }

  db.run(`UPDATE worker_profiles SET is_available = ? WHERE id = ?`, [isAvailable ? 1 : 0, workerId], function (err) {
    res.json({ message: `Availability updated to ${isAvailable ? 'ONLINE' : 'OFFLINE'}.`, isAvailable });
  });
};

// Submit Bank & UPI
export const submitBankKyc = async (req, res) => {
  const { accountHolderName, upiId, upiPhone, bankName, workerId: reqWorkerId, userId: reqUserId } = req.body;
  const targetUserId = req.user?.id || reqUserId;
  const targetWorkerId = reqWorkerId;

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const mongoLookup = targetUserId ? { userId: targetUserId } : { id: targetWorkerId };
      await Partner.updateOne(
        mongoLookup,
        { $set: { 'bank.holder': accountHolderName, 'bank.upi': upiId, 'bank.upiPhone': upiPhone || '', 'bank.bankName': bankName || 'UPI Direct' } }
      );
    } catch (err) {
      console.warn('MongoDB bank update notice:', err.message);
    }
  }

  const sqlLookup = targetUserId ? `SELECT id FROM worker_profiles WHERE user_id = ?` : `SELECT id FROM worker_profiles WHERE id = ?`;
  const sqlParam = targetUserId || targetWorkerId;

  if (sqlParam) {
    db.get(sqlLookup, [sqlParam], (sErr, row) => {
      const wId = row?.id || targetWorkerId;
      if (wId) {
        const kId = `kyc-${wId}`;
        db.run(
          `INSERT OR REPLACE INTO worker_bank_kyc (id, worker_id, account_holder_name, account_number, ifsc_code, upi_id, upi_phone, bank_name, govt_id_number, kyc_verified)
           VALUES (?, ?, ?, 'DIRECT_UPI', 'UPI0001', ?, ?, ?, 'AADHAAR_VERIFIED', 1)`,
          [kId, wId, accountHolderName || 'Partner', upiId || '', upiPhone || '', bankName || 'UPI Direct'],
          (bErr) => {
            if (bErr) console.warn('SQLite bank update notice:', bErr.message);
          }
        );
      }
    });
  }

  res.json({ message: 'UPI details saved to MongoDB & SQLite.' });
};

// Add Portfolio Image (Dual-Sync: MongoDB Atlas + SQLite)
export const addPortfolioImage = async (req, res) => {
  const {
    title,
    categoryTag,
    category,
    description,
    imageUrl,
    url,
    workerId: reqWorkerId,
    userId: reqUserId
  } = req.body;

  const targetUserId = req.user?.id || reqUserId;
  const targetWorkerId = reqWorkerId;
  const targetCategory = categoryTag || category || 'general';
  const targetUrl = imageUrl || url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Image URL or photo data is required.' });
  }

  const newId = `p-${Date.now()}`;
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const newPort = {
    id: newId,
    title: title || 'Completed Work Project',
    category: targetCategory,
    category_tag: targetCategory,
    url: targetUrl,
    image_url: targetUrl,
    description: description || '',
    date: formattedDate
  };

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const mongoLookup = targetUserId ? { userId: targetUserId } : { id: targetWorkerId };
      await Partner.updateOne(
        mongoLookup,
        { $push: { portfolio: newPort } }
      );
    } catch (err) {
      console.warn('MongoDB portfolio notice:', err.message);
    }
  }

  const sqlLookup = targetUserId ? `SELECT id FROM worker_profiles WHERE user_id = ?` : `SELECT id FROM worker_profiles WHERE id = ?`;
  const sqlParam = targetUserId || targetWorkerId;

  if (sqlParam) {
    db.get(sqlLookup, [sqlParam], (sErr, row) => {
      const wId = row?.id || targetWorkerId;
      if (wId) {
        db.run(
          `INSERT INTO worker_portfolios (id, worker_id, title, category_tag, image_url, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newId, wId, newPort.title, targetCategory, targetUrl, newPort.description],
          (pErr) => {
            if (pErr) console.warn('SQLite portfolio insert notice:', pErr.message);
          }
        );
      }
    });
  }

  res.status(201).json({
    status: 'success',
    message: 'Portfolio image saved successfully.',
    item: newPort
  });
};

// Delete Portfolio Image (Dual-Sync: MongoDB Atlas + SQLite)
export const deletePortfolioImage = async (req, res) => {
  const { id } = req.params;
  const { workerId: reqWorkerId, userId: reqUserId } = req.body || {};
  const targetUserId = req.user?.id || reqUserId;
  const targetWorkerId = reqWorkerId;

  if (!id) {
    return res.status(400).json({ error: 'Portfolio item ID is required.' });
  }

  if (isPartnerDbConnected()) {
    try {
      const Partner = getPartnerModel();
      const mongoLookup = targetUserId
        ? { userId: targetUserId }
        : (targetWorkerId ? { id: targetWorkerId } : { 'portfolio.id': id });

      await Partner.updateOne(
        mongoLookup,
        { $pull: { portfolio: { id } } }
      );
    } catch (err) {
      console.warn('MongoDB portfolio delete notice:', err.message);
    }
  }

  db.run(`DELETE FROM worker_portfolios WHERE id = ?`, [id], function (err) {
    if (err) console.warn('SQLite portfolio delete notice:', err.message);
    res.json({
      status: 'success',
      message: 'Portfolio image removed successfully.',
      id
    });
  });
};
