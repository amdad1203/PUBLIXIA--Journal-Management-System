import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import request from 'supertest';
import {connectDB} from '../backend/config/db.js';
import {createApp} from '../backend/app.js';
import {User,Journal,Notification,Conference} from '../backend/models/index.js';
import {generate} from '../backend/services/ai.js';
const credentials=JSON.parse(await fs.readFile('.local-data/team-credentials.json','utf8'));
await connectDB();
try{
 const app=createApp();const checks=[];
 for(const c of credentials){const a=request.agent(app);await a.post('/api/auth/login').send({email:c.email,password:c.password}).expect(200);await a.get('/api/auth/me').expect(200);checks.push({email:c.email,login:'passed',roles:c.roles});}
 const journal=await Journal.findOne({slug:'publixia-team-research'}).populate('editors','email');
 const sent=await Notification.countDocuments({eventKey:/^team-setup-2026-11:/,'email.state':'sent'});
 const events=await Conference.countDocuments({synthetic:false,date:{$gte:new Date()}});
 await fs.writeFile('.local-data/team-verification.json',JSON.stringify({checks,journal:journal.name,editors:journal.editors.map(u=>u.email),setupEmailsAccepted:sent,currentSourceEvents:events},null,2));
 console.log('Five login checks passed; setup emails accepted:',sent,'source events:',events);
 const owner=await User.findOne({email:credentials[0].email});
 const response=await generate({owner:owner._id,assistant:'methodology',messages:[{role:'user',text:'I am studying phishing URL classification for a university project. I have historical labeled URLs but no experimental results yet. Give a concrete evaluation design addressing temporal leakage, baselines, class imbalance and reproducibility. Keep it under 300 words.'}],context:'Research domain: Cybersecurity. Academic level: undergraduate. Prioritize practical, evidence-based methodology; do not invent results.'});
 await fs.writeFile('docs/AI_LIVE_RESPONSE.md','# Live methodology response\n\nPrompt: Design an undergraduate phishing URL classification evaluation addressing temporal leakage, baselines, imbalance and reproducibility; no results exist yet.\n\n'+response);
 console.log('Live Gemini methodology response saved:',response.length,'characters.');
}finally{await mongoose.disconnect();}
