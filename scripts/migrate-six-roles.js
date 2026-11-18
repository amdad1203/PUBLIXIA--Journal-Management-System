import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import {connectDB} from '../backend/config/db.js';
import {User,Audit} from '../backend/models/index.js';
const merge=roles=>[...new Set(roles.map(r=>['student','author','instructor'].includes(r)?'researcher':r))];
await connectDB();
try{
 const users=await User.collection.find({}).toArray();
 // Preserve original role assignments for audit/recovery; never alter passwords or owned records.
 await fs.mkdir('.local-data',{recursive:true});
 const backup='.local-data/roles-before-six-role-migration.json';
 try{await fs.writeFile(backup,JSON.stringify(users.map(u=>({_id:String(u._id),roles:u.roles,academicStatus:u.academicStatus})),null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 let changed=0;
 for(const u of users){const roles=merge(u.roles||['researcher']);const academicStatus=u.academicStatus||(u.roles.includes('student')?'undergraduate':u.roles.includes('instructor')?'faculty':u.roles.includes('author')?'academic_author':'independent_researcher');
 if(JSON.stringify(roles)!==JSON.stringify(u.roles)||!u.academicStatus){await User.updateOne({_id:u._id},{$set:{roles,academicStatus},$inc:{tokenVersion:1}});await Audit.create({action:'user.roles.merge',resource:'User',resourceId:String(u._id)});changed++;}}
 for(const file of ['.local-data/team-config.json','.local-data/team-credentials.json']){try{const rows=JSON.parse(await fs.readFile(file,'utf8'));for(const row of rows)row.roles=merge(row.roles);await fs.writeFile(file,JSON.stringify(rows,null,2));}catch(e){if(e.code!=='ENOENT')throw e;}}
 const current=await User.find().sort({email:1}).lean();
 await fs.writeFile('PRIVATE_ALL_CREDENTIALS.md','# Private Publixia account credentials\n\nAll existing passwords remain `12345`. Author, Student and Instructor legacy addresses still work; their role is now Researcher.\n\n| Email | Roles | Academic status | Password |\n|---|---|---|---|\n'+current.map(u=>`| ${u.email} | ${u.roles.join(', ')} | ${u.academicStatus} | 12345 |`).join('\n')+'\n');
 console.log(JSON.stringify({accounts:current.length,updated:changed,roles:[...new Set(current.flatMap(u=>u.roles))]}));
}finally{await mongoose.disconnect();}
