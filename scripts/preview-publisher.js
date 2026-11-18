import {connectDB} from '../backend/config/db.js';import {createApp} from '../backend/app.js';const {env}=await import('../backend/config/env.js');env.appUrl='http://127.0.0.1:4001';await connectDB();createApp().listen(4001,'127.0.0.1',()=>console.log('Publisher preview at http://127.0.0.1:4001; mail worker disabled'));

