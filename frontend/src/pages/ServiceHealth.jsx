import React from 'react';
import {useLoad} from '../context';
import {Load,Button} from '../components';
import {dateLabel} from '../api';
export default function ServiceHealth(){const {data,error,reload}=useLoad('/operations/services');return <><Load data={data} error={error}>{data?.map(s=><div className="list-row" key={s.name}><div className="grow"><b>{s.name}</b><small>{s.configured?'Configured':'Not configured'} · {s.status}</small><small>{s.checkedAt?`Checked ${dateLabel(s.checkedAt)}`:'No live verification recorded'}</small></div></div>)}</Load><p className="muted">Database status uses a live ping. Provider credentials alone do not verify AI or mail delivery.</p><Button variant="secondary small" onClick={reload}>Refresh status</Button></>}
