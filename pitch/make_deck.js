/* Entry point: assemble and write the explainer deck. */
const K = require('./build_explainer.js');
require('./slides.js');
require('./slides2.js');
const path = require('path');
const OUT = path.join(__dirname, 'DISSENT_Explainer_Nexus_Network.pptx');
K.p.writeFile({ fileName: OUT }).then(() => {
  console.log('wrote', OUT);
  console.log('slides:', K.p.slides ? K.p.slides.length : '?');
});
