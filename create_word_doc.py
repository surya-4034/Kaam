import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Set Standard Margins (0.8 in)
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Color Palette Definitions
PURPLE_DARK = RGBColor(45, 27, 78)    # #2d1b4e
PURPLE_MID = RGBColor(89, 38, 124)    # #59267c
PINK_ACCENT = RGBColor(145, 59, 130)  # #913b82
SLATE_TEXT = RGBColor(30, 41, 59)     # #1e293b
GRAY_MUTED = RGBColor(100, 116, 139)  # #64748b
EMERALD_GREEN = RGBColor(16, 185, 129)# #10b981
CYAN_BLUE = RGBColor(14, 165, 233)    # #0ea5e9
BG_LIGHT_PURPLE = "F4F0F8"
BG_CODE_BOX = "F8F9FA"

def add_heading_1(text):
    h = doc.add_heading(level=1)
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = PURPLE_DARK
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(6)
    
    pBdr = parse_xml(r'<w:pBdr %s><w:bottom w:val="single" w:sz="6" w:space="1" w:color="59267C"/></w:pBdr>' % nsdecls('w'))
    h._p.get_or_add_pPr().append(pBdr)
    return h

def add_heading_2(text):
    h = doc.add_heading(level=2)
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.bold = True
    run.font.size = Pt(12.5)
    run.font.color.rgb = PINK_ACCENT
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    return h

def add_heading_3(text):
    h = doc.add_heading(level=3)
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.bold = True
    run.font.size = Pt(10.5)
    run.font.color.rgb = PURPLE_MID
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(2)
    return h

def add_body_paragraph(text, bold_prefix="", italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = SLATE_TEXT
    r_body = p.add_run(text)
    r_body.font.name = 'Arial'
    r_body.font.size = Pt(9.5)
    r_body.font.italic = italic
    r_body.font.color.rgb = SLATE_TEXT
    return p

def add_diagram_box(diagram_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(8)
    
    pPr = p._p.get_or_add_pPr()
    pBdr = parse_xml(r'<w:pBdr %s><w:top w:val="single" w:sz="4" w:space="4" w:color="913B82"/><w:left w:val="single" w:sz="12" w:space="4" w:color="59267C"/><w:bottom w:val="single" w:sz="4" w:space="4" w:color="913B82"/><w:right w:val="single" w:sz="4" w:space="4" w:color="913B82"/></w:pBdr>' % nsdecls('w'))
    shd = parse_xml(r'<w:shd %s w:fill="%s"/>' % (nsdecls('w'), BG_CODE_BOX))
    pPr.append(pBdr)
    pPr.append(shd)

    run = p.add_run(diagram_text)
    run.font.name = 'Courier New'
    run.font.size = Pt(8)
    run.font.color.rgb = PURPLE_DARK
    return p

# ==============================================================================
# DOCUMENT COVER & HEADER
# ==============================================================================
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
t_run = title_p.add_run("kaam (काम) Marketplace")
t_run.font.name = 'Arial'
t_run.font.size = Pt(24)
t_run.font.bold = True
t_run.font.color.rgb = PURPLE_DARK

sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_p.paragraph_format.space_after = Pt(12)
s_run = sub_p.add_run("Master Technical Architecture, Working Model & Complete Development Specification")
s_run.font.name = 'Arial'
s_run.font.size = Pt(12)
s_run.font.color.rgb = PINK_ACCENT
s_run.font.bold = True

meta_p = doc.add_paragraph()
meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta_p.paragraph_format.space_after = Pt(16)
m_run = meta_p.add_run("Production Document • Version 4.0 • Enterprise Web Platform Standard")
m_run.font.name = 'Arial'
m_run.font.size = Pt(9.5)
m_run.font.italic = True
m_run.font.color.rgb = GRAY_MUTED

# ==============================================================================
# SECTION 1: DETAILED MAIN PURPOSE & OPERATIONAL WORKING MODEL
# ==============================================================================
add_heading_1("1. Main Purpose & Operational Working Model")

add_heading_2("The Real-World Problem in India")
add_body_paragraph("In India, finding reliable skilled tradespeople (plumbers, electricians, construction mistry, painters, carpenters, tile masons, welders, and cleaners) relies almost entirely on word-of-mouth or unorganized street-corner labor stands (naka). Clients face inconsistent pricing, lack of verification, and poor service guarantees. On the other hand, skilled workers face irregular work, delayed daily wage payments, and unfair intermediary cuts.")

add_heading_2("The kaam (काम) Solution & Platform Purpose")
add_body_paragraph("kaam (काम) solves this by building a dedicated digital ecosystem operating on public internet web platforms. It connects clients directly with verified local tradespeople with transparent daily wages (₹/day), hourly rates (₹/hr), Aadhaar KYC verification, and an automated 36-hour commission clearing mechanism.")

add_heading_2("Detailed Operational System Architecture")

diagram_full_working = """
+---------------------------------------------------------------------------------------------------+
|                                 KAAM (काम) ECOSYSTEM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|    [ CLIENT SITE ]                    [ WORKER SITE ]                  [ MASTER ADMIN PORTAL ]    |
|  http://localhost:5174               http://localhost:5175              http://localhost:5176    |
|         |                                  |                                    |                 |
|         | 1. Search Trade & Locality       | 1. Register Trade & Fee (₹/day)    | 1. Manage Users |
|         | 2. Book Job (Direct Cash)        | 2. Submit Aadhaar & Bank UPI       | 2. Approve KYC  |
|         | 3. Pay Daily Wage                | 3. Execute Job & Clear 10% Dues     | 3. Audit Dues   |
|         |                                  |                                    |                 |
|         +----------------------------------+------------------------------------+                 |
|                                            |                                                      |
|                                            v                                                      |
|                             [ CENTRAL PRODUCTION REST API ]                                       |
|                                 http://localhost:5050                                             |
|                                            |                                                      |
|         +----------------------------------+----------------------------------+                   |
|         |                                  |                                  |                   |
|         v                                  v                                  v                   |
|  [ SQLite DATABASE ]             [ GMAIL SMTP SERVICE ]             [ AUTOMATED 36H CRON ]        |
|  - Users & Workers               - Real OTP Email Dispatch          - 36h Dues Countdown          |
|  - KYC & Dues Ledger             - Security Alert Notifications     - Auto Account Locking        |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
"""
add_diagram_box(diagram_full_working)

add_heading_2("Ecosystem Microservices Table")

table_domains = doc.add_table(rows=5, cols=3)
table_domains.alignment = WD_TABLE_ALIGNMENT.CENTER
table_domains.autofit = False

headers_dom = ["Service / App", "Local Endpoint", "Core Purpose & Features"]
data_dom = [
    ["kaam Client Portal", "http://localhost:5174", "Client web portal to search local trades, view worker profiles, book jobs, and pay daily wages."],
    ["kaam Worker Portal", "http://localhost:5175", "Dedicated worker web app to receive job alerts, set daily rates, manage KYC, and clear dues."],
    ["Master Admin Portal", "http://localhost:5176", "Control console for Admin ID Surya-4034 to manage accounts, approve KYC, and audit 36h dues."],
    ["Central REST API Server", "http://localhost:5050", "Node/Express server handling DB persistence, bcrypt auth, Gmail SMTP OTP, and dues cron."]
]

for col_idx, text in enumerate(headers_dom):
    cell = table_domains.cell(0, col_idx)
    cell.paragraphs[0].text = text
    cell.paragraphs[0].runs[0].font.bold = True
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    shd = parse_xml(r'<w:shd %s w:fill="2D1B4E"/>' % nsdecls('w'))
    cell._tc.get_or_add_tcPr().append(shd)

for row_idx, row_data in enumerate(data_dom):
    row_cells = table_domains.rows[row_idx + 1].cells
    for col_idx, text in enumerate(row_data):
        row_cells[col_idx].text = text
        row_cells[col_idx].paragraphs[0].runs[0].font.name = 'Arial'
        row_cells[col_idx].paragraphs[0].runs[0].font.size = Pt(9)
        if row_idx % 2 == 1:
            shd = parse_xml(r'<w:shd %s w:fill="%s"/>' % (nsdecls('w'), BG_LIGHT_PURPLE))
            row_cells[col_idx]._tc.get_or_add_tcPr().append(shd)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# ==============================================================================
# SECTION 2: EXHAUSTIVE RECORD OF WHAT WE HAVE DONE (COMPLETED WORK)
# ==============================================================================
add_heading_1("2. Exhaustive Record of What We Have Accomplished")

add_heading_2("A. Authentication & Security Systems")
add_body_paragraph("Official Firebase Google Sign-In (signInWithPopup) enabled on Client & Worker apps with zero billing required.", "• Google OAuth 1-Click Verification: ")
add_body_paragraph("Integrated Gmail SMTP with App Password (EMAIL_USER=sy623806@gmail.com) for real email delivery globally.", "• Gmail SMTP Real Email OTP Dispatch: ")
add_body_paragraph("Implemented in-form [ Verify Mail ] button requiring 6-digit confirmation code before entering password.", "• In-Form \"Verify Mail\" Requirement: ")
add_body_paragraph("Forgot Password recovery mechanism displays 6-digit OTP code input on the same page directly below the email input field.", "• Same-Page Forgot Password Recovery: ")
add_body_paragraph("Upon resetting password, users are automatically transferred to the Sign-In screen with a success notice rather than receiving direct account access.", "• Auto-Transfer to Sign-In Screen: ")
add_body_paragraph("Dispatches automated security confirmation emails to user inboxes upon updating password.", "• Security Confirmation Emails: ")

add_heading_2("B. Master Admin Portal & Security Controls")
add_body_paragraph("Configured Master Admin ID Surya-4034 with encrypted bcrypt password storage in SQLite database.", "• Master Admin Credentials: ")
add_body_paragraph("Automated email alert dispatched to kaamadmin@gmail.com instantly upon successful login.", "• Real-Time Login Alerts: ")
add_body_paragraph("Clicking 'Forgot Password?' dispatches secret code to kaamadmin@gmail.com and opens the 'TYPE ADMIN SECRET CODE' verification screen.", "• Admin Secret Code Flow: ")
add_body_paragraph("Secret code verification screen heading reads 'TYPE ADMIN SECRET CODE' with all email text lines removed for maximum privacy.", "• Streamlined Verification UI: ")
add_body_paragraph("Interactive Eye icon (Eye / EyeOff) on the login Key field and reset confirm password field to toggle text visibility.", "• Eye Password Visibility Toggle: ")
add_body_paragraph("Authentication strictly checks bcrypt password hash stored in database. Resetting password invalidates old password immediately.", "• Strict Password Invalidation: ")
add_body_paragraph("Signing out immediately clears all input states (adminId, password, secretCode) requiring manual re-entry.", "• Session & Form State Clearing: ")
add_body_paragraph("Features 4 dedicated control sections: Homeowner Clients, Tradespeople Workers, Pending KYC Submissions Queue, and 36-Hour Dues Audit Ledger.", "• 4 Core Control Sections: ")

add_heading_2("C. Production Aesthetics & Visual Background Themes")
add_body_paragraph("Deep Forest Emerald Teal & Warm Amber/Gold theme with HD home architecture background photo overlay.", "• Client App Theme: ")
add_body_paragraph("Blue Street Cyan Corporate theme with HD city grid background image, dark slate navbar, and electric top accent line.", "• Master Admin Portal Theme: ")
add_body_paragraph("Skilled trades craftsman amber/slate theme with HD engineering tools background photo overlay.", "• Worker App Theme: ")

add_heading_2("D. Project Architecture & Workspace Organization")
add_body_paragraph("Unified multi-service process launcher (npm start via start-services.js) executing all 4 local microservices concurrently.", "• Single-Command Process Launcher: ")
add_body_paragraph("Organized 21 Playwright test scripts and 18 visual screenshot artifacts into dedicated tests/ and tests/screenshots/ directories.", "• Clean Workspace Structure: ")

# ==============================================================================
# SECTION 3: FUTURE DEVELOPMENT ROADMAP TO ACHIEVE MAIN GOAL
# ==============================================================================
add_heading_1("3. Future Development Roadmap to Achieve Main Goal")

add_body_paragraph("To achieve our overarching goal of transforming kaam into India's #1 digital trades platform, the upcoming development phases are structured into 4 core units:")

add_heading_2("Unit 2: Client & Worker Post-Registration Detail Collection Wizards")
add_body_paragraph("Build post-registration wizards to collect full profile & trade details from newly registered users after sign up:")
add_body_paragraph("Collect secondary phone number, home/site address, preferred work timings, and project requirements.", "• Client Detail Collection: ")
add_body_paragraph("Collect trade specialization (Plumber, Electrician, Mistry, Painter, Mason, Carpenter, Welder), daily wage fee (₹/day), hourly rate (₹/hr), experience years, Aadhaar number, bank account, IFSC code, direct UPI ID, and portfolio work photos.", "• Worker Trade Onboarding: ")

add_heading_2("Unit 3: Job Posting, Radius Filtering & Worker Marketplace")
add_body_paragraph("Implement job creation, worker discovery, radius filtering, emergency 1-hour dispatch, and worker rating system.")

add_heading_2("Unit 4: Automated 36-Hour Platform Commission Dues Monitoring & Settlement")
add_body_paragraph("Track 10% platform commission fee on cash jobs, display 36h countdown timer, integrate UPI payment link, and trigger automated account locking upon 36h expiry.")

add_heading_2("Unit 5: In-App Real-Time Chat, Direct Phone Calling & Live Progress Tracker")
add_body_paragraph("Socket.io real-time chat, direct click-to-call phone links, and live job status tracking (Requested -> Accepted -> On The Way -> In Progress -> Completed -> Paid).")

# Save Documents
doc_path_project = "/Users/mac/.gemini/antigravity/scratch/kaam/kaam_Master_Project_Standard_Specification.docx"
doc.save(doc_path_project)
print(f"Production Master Document saved successfully at: {doc_path_project}")
