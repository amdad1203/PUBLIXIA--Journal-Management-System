import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import {connectDB} from '../backend/config/db.js';
import {root} from '../backend/config/env.js';
import {User,Audit} from '../backend/models/index.js';

// Explicitly requested identity merge. IDs, accounts and project memberships stay intact.
try {
  await connectDB();
  const users=await User.collection.find({roles:{$in:['supervisor','author','student']}}).project({_id:1,roles:1,tokenVersion:1}).toArray();
  if(!users.length){console.log('Five-role migration already applied.');}
  else {
    const backup=path.join(root,'.local-data',`five-role-memberships-before-${Date.now()}.json`);
    await fs.mkdir(path.dirname(backup),{recursive:true});await fs.writeFile(backup,JSON.stringify(users,null,2));
    for(const u of users){
      const next=[...new Set(u.roles.map(role=>['supervisor','author','student'].includes(role)?'researcher':role))];
      const changed=await User.collection.updateOne({_id:u._id,roles:u.roles},{$set:{roles:next},$inc:{tokenVersion:1}});
      if(changed.modifiedCount)await Audit.create({action:'roles.merge_researcher',resource:'User',resourceId:String(u._id),details:{previousRoles:u.roles,roles:next,reason:'User-requested merger of supervision and authorship into Researcher.'}});
    }
    console.log(`Merged role labels on ${users.length} existing accounts. No accounts, manuscript records or memberships were replaced.`);
  }
} finally {await mongoose.disconnect();}
