import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeForumRuns,normalizeForumColor} from '../lib/forum-format.js';
test('normalizes browser color formats and preserves text and bold',()=>{
 assert.equal(normalizeForumColor('rgb(220 38 38)'),'rgb(220, 38, 38)');
 assert.equal(normalizeForumColor('#1565c0'),'rgb(21, 101, 192)');
 const runs=[{text:'Cảm ơn ',color:'color(srgb 0 0 0)',bold:false},{text:'Thầy/Cô',color:'rgb(220,38,38)',bold:true}];
 const result=normalizeForumRuns(runs,'Cảm ơn Thầy/Cô');
 assert.equal(result[0].color,'rgb(0, 0, 0)');assert.equal(result[1].bold,true);assert.equal(result[1].color,'rgb(220, 38, 38)');
 assert.equal(normalizeForumRuns(runs,'Khác nội dung'),null);
 assert.equal(normalizeForumRuns([{text:'abc',bold:'yes'}],'abc'),null);
});
