/* global document */
// External module of component-silver-bullet.index.es6
// contains functions to handle assembly and export
// of SVG file.
// Default function at bottom calls internal functions.

// MAKE SVG FILENAME
// Called from downloadSvg to assemble a timestamed svg filename
function makeSvgFilename() {
  const myDate = new Date();
  let timeStamp = `${myDate.getMonth()}-${myDate.getDate()}-`;
  timeStamp += `${myDate.getHours()}-${myDate.getMinutes()}`;
  return `svg-${timeStamp}.svg`;
}
// MAKE SVG FILENAME ends

// DOWNLOAD SVG
// Called from index.es6 > catchReturnedSvg.
// Passed the complete svg text, downloads it to a datastamped .svg file...
function downloadSvg(text) {
  const aElement = document.createElement('a');
  const fileName = makeSvgFilename();
  aElement.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  aElement.setAttribute('download', fileName);
  document.body.appendChild(aElement);
  if (document.createEvent) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    aElement.dispatchEvent(event);
  } else {
    aElement.click();
  }
  document.body.removeChild(aElement);
}
// DOWNLOAD SVG ends

// GET CHART STYLES
// Harvest CSS for SVG export
// (see: http://spin.atomicobject.com/2014/01/21/convert-svg-to-png/)
function getChartStyles() {
  let used = '';
  const sheets = document.styleSheets;
  for (let i = 0; i < sheets.length; i++) {
    const rules = sheets[i].cssRules;
    for (let ruleNo = 0; ruleNo < rules.length; ruleNo++) {
      const rule = rules[ruleNo];
      if (typeof (rule.style) !== 'undefined') {
        const elems = document.querySelectorAll(rule.selectorText);
        if (elems.length > 0) {
          const selText = rule.selectorText;
          if (selText.includes('d3')) {
            used += `${selText} { ${rule.style.cssText} }\n`;
          }
        }
      }
    }
  }
  // Pre/append tags:
  const pref = '<defs>\n<style type="text/css"><![CDATA[\n';
  const suff = '\n]]></style>\n</defs>';
  return pref + used + suff;
}
// GET CHART STYLES ends

// DEFAULT
// Called from index > catchReturnedSvg. Args are the 'raw' svg
// from the chart, and the svg config object
// Prefixes and appends svg defs and styles to the raw svg
export default function (svgString, svgConfig) {
  // Assemble an SVG file from boilerplate
  let svgExport = '';
  // Headers
  for (const head in svgConfig.header) {
    svgExport += svgConfig.header[head];
  }
  // We need to apply CSS styles to the SVG, so harvest and append them...
  svgExport += getChartStyles();
  // Embed content in group with transform down the page
  // (NOTE: ventually calculate by chart size...?)
  svgExport += svgConfig.transform;
  // Actual SVG content
  svgExport += svgString;
  // ...and footer
  svgExport += svgConfig.footer;
  // And call function to download
  downloadSvg(svgExport);
}
// DEFAULT  ends
