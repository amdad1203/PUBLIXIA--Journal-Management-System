import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connectDB} from '../backend/config/db.js';
import {env} from '../backend/config/env.js';
import {createApp} from '../backend/app.js';
import * as M from '../backend/models/index.js';
await connectDB();
try{
 const app=createApp(),results=[];
 for(const [email,routes] of [['amdadboss11@gmail.com',['/operations/editor','/editorial/assignments','/operations/journals']],['amdadulhaque1203@gmail.com',['/operations/users','/operations/journals','/operations/services']]]){
  const u=await M.User.findOne({email}),cookie=`publixia_session=${jwt.sign({sub:String(u._id),version:u.tokenVersion},env.jwtSecret,{expiresIn:'5m'})}`;
  for(const url of routes){await request(app).get('/api'+url).set('Cookie',cookie).expect(200);results.push({role:u.roles[0],url,status:200});}
 }
 const manuscripts=await M.Manuscript.find({code:/^PX-SUP-/});
 for(const m of manuscripts){assert.ok(await M.User.exists({_id:m.author}));assert.ok(await M.Journal.exists({_id:m.journal}));assert.ok(await M.Version.exists({manuscript:m._id,number:m.currentVersion}));
  for(const a of await M.Assignment.find({manuscript:m._id})){assert.ok(await M.User.exists({_id:a.reviewer}));if(a.status==='completed')assert.ok(await M.Review.exists({assignment:a._id,manuscript:m._id}));}
  if(m.productionStatus!=='not_started'){assert.equal(m.editorialStatus,'accepted');assert.ok(m.handoff.at);assert.ok(m.decisions.length);}
  if(m.publicationStatus==='published'){assert.ok(await M.Issue.exists({_id:m.issue,journal:m.journal}));assert.ok(await M.ManuscriptFile.exists({_id:m.qualityCheck.file,manuscript:m._id,state:'approved'}));}
 }
 const report={checkedAt:new Date(),readOnly:true,endpoints:results,supplementalManuscripts:manuscripts.length,integrity:'passed',counts:{users:await M.User.countDocuments(),reviewers:await M.User.countDocuments({roles:'reviewer'}),manuscripts:await M.Manuscript.countDocuments(),reviews:await M.Review.countDocuments()}};
 await fs.writeFile('docs/editor-admin-live-checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await mongoose.disconnect();}
