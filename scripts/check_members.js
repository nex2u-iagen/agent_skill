const path = require('path');
const { MemberRepository } = require(path.join(process.cwd(), 'dist', 'persistence', 'MemberRepository'));
const repo = new MemberRepository();
console.log('LIST_START');
console.log(JSON.stringify(repo.list(), null, 2));
console.log('LIST_END');
