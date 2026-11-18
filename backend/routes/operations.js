import {Router} from 'express';
import {auth,allow} from '../middleware/auth.js';
import {Journal,Manuscript,Assignment,User,Audit} from '../models/index.js';
import mongoose from 'mongoose';
import {env} from '../config/env.js';
import {mailConfigured} from '../services/notifications.js';
import {publisherRecords} from '../services/production.js';
export const operations=Router();
operations.use('/operations',auth);
operations.get('/operations/publisher',allow('publisher'),async(req,res)=>res.json(await publisherRecords(req.user)));
operations.get('/operations/services',allow('admin'),async(req,res)=>{
 let database='unavailable';try{await mongoose.connection.db.admin().ping();database='verified';}catch{}
 res.json([{name:'Database',configured:true,status:database,checkedAt:new Date()},{name:'Gemini',configured:!!env.geminiKey,status:'not verified',checkedAt:null},{name:'SMTP mail',configured:mailConfigured(),status:'not verified',checkedAt:null}]);
});
operations.get('/operations/editor',allow('editor'),async(req,res)=>{
 const journals=await Journal.find({editors:req.user._id}).lean();
 const manuscripts=await Manuscript.find({journal:{$in:journals.map(j=>j._id)},status:{$ne:'draft'}}).select('code title journal author status editorialStatus submittedAt createdAt updatedAt currentVersion').populate('journal','name').populate('author','name').sort({submittedAt:-1,createdAt:-1}).lean();
 const assignments=await Assignment.find({manuscript:{$in:manuscripts.map(m=>m._id)}}).select('-draft -draftHistory').populate('reviewer','name affiliation').lean();
 const records=manuscripts.map(m=>{const rows=assignments.filter(a=>String(a.manuscript)===String(m._id)&&a.round===m.currentVersion);return {...m,completedReviews:rows.filter(a=>a.status==='completed').length,pendingReviews:rows.filter(a=>['invited','accepted'].includes(a.status)).length};});
 const activity=await Audit.find({resource:'Manuscript',resourceId:{$in:manuscripts.map(m=>String(m._id))}}).populate('actor','name').sort({createdAt:-1}).limit(12);
 res.json({manuscripts:records,assignments,journals,activity,stats:{submitted:records.filter(m=>(m.editorialStatus||m.status)==='submitted').length,underReview:records.filter(m=>(m.editorialStatus||m.status)==='under_review').length,completed:assignments.filter(a=>a.status==='completed').length,decisionPending:records.filter(m=>(m.editorialStatus||m.status)==='under_review'&&m.completedReviews>0&&m.pendingReviews===0).length}});
});
operations.get('/operations/users',allow('admin'),async(req,res)=>{
 const journals=await Journal.find().select('name editors').lean();
 const users=await User.find().select('name email roles active emailVerified createdAt').sort({name:1}).lean();
 res.json(users.map(u=>({...u,id:String(u._id),journals:journals.filter(j=>j.editors.some(id=>String(id)===String(u._id))).map(j=>({_id:j._id,name:j.name}))})));
});
operations.get('/operations/journals',allow('editor','admin'),async(req,res)=>{
 const list=await Journal.find(req.user.roles.includes('admin')?{}:{editors:req.user._id}).populate('editors','name roles').lean();
 res.json(await Promise.all(list.map(async j=>({...j,submissions:await Manuscript.countDocuments({journal:j._id,status:{$ne:'draft'}})}))));
});
