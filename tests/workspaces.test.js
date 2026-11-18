import {test} from 'node:test';
import assert from 'node:assert/strict';
import {navigation} from '../frontend/src/navigation.js';
import {canVisit,WORKSPACES} from '../shared/workspaces.js';
test('five compact workspaces expose distinct task routes and reject unrelated work',()=>{
  assert.equal(Object.keys(WORKSPACES).length,5);
  for(const [role,groups] of Object.entries(navigation))for(const [,links] of groups)for(const [url] of links)assert.ok(canVisit(role,url),`${role}: ${url}`);
  for(const role of ['reviewer','editor','publisher','admin'])for(const url of ['/studio','/research','/screening'])assert.equal(canVisit(role,url),false);
  assert.equal(canVisit('researcher','/editorial/decisions'),false);
  assert.equal(canVisit('reviewer','/production'),false);
  assert.equal(canVisit('editor','/production'),false);
  assert.equal(canVisit('publisher','/editorial/assignments'),false);
  assert.equal(canVisit('admin','/production'),false);
  assert.deepEqual(Object.values(navigation).map(groups=>groups.reduce((n,g)=>n+g[1].length,0)),[7,5,6,5,5]);
});
