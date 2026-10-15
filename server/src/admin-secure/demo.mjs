import {createDemoServer} from './src/server.mjs';
const {server}=await createDemoServer({dataPath:process.env.KAAM_ADMIN_DB||'.data/demo.sqlite',port:Number(process.env.PORT||5050)});
console.log(`Kaam admin API demo running on http://127.0.0.1:${server.address().port}`);
