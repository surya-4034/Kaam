import bcrypt from 'bcryptjs';
import {fromSqlite3Connection} from './store.mjs';
import {createAdminRouter} from './server.mjs';

/**
 * Mount the console into Kaam's existing Express server.
 *
 * Keep this router under a new prefix while validating the integration. Once
 * verified, replace the old unauthenticated adminRoutes mount with this one.
 */
export function mountKaamAdmin(app,{db,prefix='/api/admin-secure',adminRole='owner'}={}){
 if(!app||!db)throw new Error('mountKaamAdmin requires the Kaam Express app and sqlite3 database connection.');
 const store=fromSqlite3Connection(db);
 const adminLogin=async(input,password)=>store.read(async driver=>{const user=await driver.get("SELECT id,full_name,email,role,password_hash,is_active FROM users WHERE (lower(email)=? OR lower(id)=?) AND role='ADMIN' LIMIT 1",[input,input]);if(!user||!user.password_hash||!await bcrypt.compare(password,user.password_hash))return null;return user});
 const router=createAdminRouter({store,mode:'integration',adminLogin,adminRole});
 app.use(prefix,router);
 return {store,prefix};
}
