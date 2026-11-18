import React,{useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {Field,Button} from '../components';
import {useAction} from '../context';
import {api} from '../api';
export default function WritingAssistant({passage='',sourceIds=[]}){
 const [prompt,setPrompt]=useState('Improve clarity and academic tone while preserving the meaning.'),[answer,setAnswer]=useState(''),[consent,setConsent]=useState(false);const {run,busy}=useAction();
 return <details className="panel"><summary><b>Writing assistance</b> · Get feedback on this section</summary><form onSubmit={async e=>{e.preventDefault();const c=await run(()=>api('/ai/conversations',{method:'POST',body:{assistant:'writing',title:'Writing Studio feedback'}}));if(!c)return;const r=await run(()=>api(`/ai/conversations/${c._id}/messages`,{method:'POST',body:{message:`${prompt}\n\nPassage:\n${passage}`.slice(0,12000),includeContext:true,sourceIds:sourceIds.slice(0,20)}}));if(r)setAnswer(r.messages.filter(m=>m.role==='model').at(-1)?.text||'No response returned.');}}><Field label="What would you like help with?"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={2000}/></Field><label className="check-label"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Send this section and selected evidence to the configured AI service.</label><Button disabled={busy||!consent||!passage.trim()}>{busy?'Preparing feedback…':'Get writing feedback'}</Button></form>{answer&&<div className="prose"><ReactMarkdown>{answer}</ReactMarkdown><p className="muted">Review suggestions before applying them to your manuscript.</p></div>}</details>;
}
