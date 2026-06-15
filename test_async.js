const util = require('util');
async function testAsync() {
  throw new TypeError("This is a sync error in async func");
}
function testSync() {
  try {
    testAsync();
    console.log("EXECUTION CONTINUES!");
  } catch (e) {
    console.log("CAUGHT", e);
  }
}
testSync();
