/* global document */
import React from 'react';
// import Dthree from 'd3';
// Context components -- only 'print' so far...
import PrintStyles from '@economist/component-silver-styles-print';
// Operational preferences:
import Operations from './assets/operations.json';

export default class SilverBullet extends React.Component {

  // PROP TYPES
  static get propTypes() {
    return {
      config: React.PropTypes.object.isRequired,
      test: React.PropTypes.string,
    };
  }
  // PROP TYPES ends

  // CONSTRUCTOR
  // Set default state
  constructor(props) {
    super(props);
    this.state = {
      config: props.config,
      // Set flag for SVG retrieval to default false
      getSvg: false,
    };
  }
  // CONSTRUCTOR ends

  // *** EVENT CATCHERS ***

  // CATCH DATA CHANGE EVENT
  // Called from render > textarea > change event
  // Override existing config with updated data
  catchDataChangeEvent(event) {
    const config = this.state.config;
    // Grab the textarea's contents and convert to useable format
    const newData = this.tsvToDataArray(event.target.value);
    config.data = newData.data;
    // Min/max/increment:
    // *** Careful: HARD-WIRED TO SINGLE-SCALE AT PRESENT.
    // *** Will need to work with 2 scales on scatter charts, eventually...
    // AND PROBABLY IN THE WRONG PLACE -- MOVES DOWN TO ChartWrapper, or something...
    const mmiObj = this.getScaleMinMaxIncr(0, newData.maxVal, Operations.ticks);
    // Unpick:
    config.minmax = mmiObj;
    // config.ticks = mmiObj.ticks;
    config.pointCount = newData.pointCount;
    config.seriesCount = newData.seriesCount;
    config.longestCatString = newData.longestCatString;
    this.setState({ config });
  }
  // CATCH DATA CHANGE EVENT ends

  // CATCH DATA KEY DOWN EVENT
  // Called from render > textarea > keydown event to
  // pre-empt default tab-insertion and put a tab in data field
  catchDataKeydownEvent(event) {
    if (event.keyCode === 9) {
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(end);
      // set textarea value to: text before caret + tab + text after caret
      target.value = `${textBefore}\t${textAfter}`;
      // put caret at right position again (add one for the tab)
      target.selectionStart = target.selectionEnd = start + 1;
      // prevent the focus lose
      event.preventDefault();
    }
  }
  // CATCH DATA KEY DOWN EVENT ends

  // CATCH EXPORT-PNG CLICK
  // When user clicks the EXPORT button, the state flag getSvg is set to true,
  // precipitating a re-render that passes down the request for the SVG content
  catchPngExportClick() {
    this.setState({ getSvg: true });
  }
  // CATCH EXPORT-PNG CLICK ends

  // CATCH RETURNED SVG
  // Callback for SVG content returned from style-specific component
  // Sets the state flag getSVG off again
  // svgString is the SVG node's content, passed up from the style component
  catchReturnedSvg(svgString) {
    // Assemble an SVG file from boilerplate in Operations
    let svgExport = '';
    // Headers
    for (const head in Operations.svgHeader) {
      svgExport += Operations.svgHeader[head];
    }
    // We need to apply CSS styles to the SVG, so harvest and append them...
    svgExport += this.getChartStyles();
    // Embed content in group with transform down the page
    // (Eventually calculate by chart size...)
    svgExport += Operations.svgTransform;
    // Actual SVG content
    svgExport += svgString;
    // ...and footer
    svgExport += Operations.svgFooter;
    this.downloadSvg(svgExport);
    // Reset flag... until the next time...
    this.setState({ getSvg: false });
  }
  // CATCH RETURNED SVG ends

  // *** EVENT CATCHERS END ***

  // *** SVG PARSERS ***

  // DOWNLOAD SVG
  // Called from catchReturnedSvg. Passed the complete svg text,
  // it downloads it to a datastamped .svg file...
  downloadSvg(text) {
    const aElement = document.createElement('a');
    const fileName = this.makeSvgFilename();
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

  // MAKE SVG FILENAME
  // Called from downloadSvg to assemble a timestamed svg filename
  makeSvgFilename() {
    const myDate = new Date();
    let timeStamp = `${myDate.getMonth()}-${myDate.getDate()}-`;
    timeStamp += `${myDate.getHours()}-${myDate.getMinutes()}`;
    return `svg-${timeStamp}.svg`;
  }
  // MAKE SVG FILENAME ends

  // GET CHART STYLES
  // Harvest CSS for SVG export
  // (see: http://spin.atomicobject.com/2014/01/21/convert-svg-to-png/)
  getChartStyles() {
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

  // *** SVG PARSERS END ***

  // TSV TO DATA ARRAY
  // Converts tsv into an array of objects with 'category' and 'value' properties
  // *** CURRENT ASSUMPTION THAT THERE'S JUST ONE SERIES ***
  // Returns an object with data and maxVal properties
  tsvToDataArray(tsv) {
    // Max val, longest cat string, and data array to return:
    let maxVal = 0;
    let maxCatLen = 0;
    let longestCat = '.';
    const dArray = [];
    // Convert string to an array (by rows)
    const data = tsv.split(/\r?\n/);
    // Count rows (points):
    let rLen = data.length;
    // Now turn each 'row' into an array:
    for (let rNo = 0; rNo < rLen; rNo++) {
      data[rNo] = data[rNo].split(/\t/);
    }
    // Count columns:
    const cLen = data[0].length;
    // So now we have an array of arrays...
    // Do we have headers? If not, invent them:
    // (*** more to do here: can't stay locked to category/value ***)
    let headArray = [];
    if (data[0][0] === 'category') {
      headArray = data.shift();
      rLen--;
    } else {
      headArray = [ 'category' ];
      for (let i = 1; i < cLen; i++) {
        // headArray.push(`value${i}`);
        headArray.push(`value`);
      }
    }
    // So headArray is an array of header strings
    // Now convert from raw data structure array/array to my array/object
    // By row
    for (let rNo = 0; rNo < rLen; rNo++) {
      const thisRow = data[rNo];
      const tempObj = {};
      // Each element in the row becomes an object property
      // that gets its name from the headers
      for (let cNo = 0; cNo < cLen; cNo++) {
        const seriesName = headArray[cNo];
        let val = thisRow[cNo];
        tempObj[seriesName] = val;
        if (cNo > 0) {
          // val is a string, so...
          if (val.search('.') > -1) {
            val = parseFloat(val);
          } else {
            val = parseInt(val, 10);
          }
          if (val > maxVal) {
            maxVal = val;
          }
        } else {
          // Finding longest category string...
          const catLen = val.length;
          if (catLen > maxCatLen) {
            maxCatLen = catLen;
            longestCat = val;
          }
        }
      }
      dArray.push(tempObj);
    }
    // Return data (array of objects), maxVal and array of headers, plus
    // number of series (i.e. cols - 1) and points (rows, without headers),
    // and longest string found...
    return {
      data: dArray,
      maxVal,
      headers: headArray,
      seriesCount: (cLen - 1),
      pointCount: rLen,
      longestCatString: longestCat,
    };
  }
  // CSV TO JSON ends

  // MIN MAX OBJECT
  // Passed 3 args: actual min val; actual max val; ideal number of increment-steps
  // Returns obj with 4 properties: min, max, increment and an updated step-count
  getScaleMinMaxIncr(minVal, maxVal, stepNo) {
    const mmObj = {};
    // Array of "acceptable" increments
    const plausibleIncrs = Operations.plausibleIncrements;
    let min = 0;
    let max = 0;
    // Min can't exceed zero; max can't be less than zero
    minVal = Math.min(0, minVal);
    maxVal = Math.max(0, maxVal);
    // Do (max-min) / steps to get a raw increment
    let incr = (maxVal - minVal) / stepNo;
    // Increment is presumably imperfect, so loop through
    // the array of values, raising the increment
    // to the next acceptable value
    for (let i = 0; i < plausibleIncrs.length; i++) {
      const plausVal = plausibleIncrs[i];
      if (plausVal >= incr) {
        incr = plausVal;
        break;
      }
    }
    // From zero, lower min to next acceptable value on or below inherited min
    while (Math.floor(min) > Math.floor(minVal)) {
      min -= incr;
    }
    // From zero, raise max to next acceptable value on or above inherited max
    while (max < maxVal) {
      max += incr;
    }
    // Revise number of ticks?
    const ticks = (max - min) / incr;
    mmObj.min = min;
    mmObj.max = max;
    mmObj.increment = incr;
    mmObj.ticks = ticks;
    return mmObj;
  }
  // MIN MAX OBJECT ends

  // GET CHART CONTEXT
  // Called from render
  // Extracts context string ('print', etc) from data and
  // returns the appropriate child component as JSX
  // Passed props are the data object; the getSVG flag;
  // and the callback to which svg content is returned
  getChartContext(config, getSvg) {
    const contextStr = config.context;
    switch (contextStr) {
      case 'print':
        return <PrintStyles config={config} getSvg={getSvg} passSvg={this.catchReturnedSvg.bind(this)}/>;
      default:
        return <PrintStyles config={config} getSvg={getSvg} passSvg={this.catchReturnedSvg.bind(this)}/>;
    }
  }
  // GET CHART CONTEXT ends

  // RENDER
  // A note on structure. There's an outermost-wrapper to
  // wrap *everything*. Then the mainouter-wrapper holds the main content;
  // and there's a sticky footer-wrapper at the bottom...
  render() {
    const config = this.state.config;
    const getSvg = this.state.getSvg;
    // Use appropriate CSS over-rides:
    const chartContext = this.getChartContext(config, getSvg);
    const defaultTextValue = 'Paste data here\n(Row 1 must include "category" and "value" headers)';
    return (
      <div className="silverbullet-outermost-wrapper">
        <div className="silverbullet-mainouter-wrapper">
          <div className="silverbullet-maininner-wrapper">
            <div className="silverbullet-chart-wrapper" ref="chartwrapper">
              {chartContext}
            </div>
            <div className="silverbullet-editor-wrapper" config={config}>
              <textarea
                className="silverbullet-editor-datafield"
                defaultValue={defaultTextValue}
                onChange={this.catchDataChangeEvent.bind(this)}
                onKeyDown={this.catchDataKeydownEvent.bind(this)}
              >
              </textarea>
            </div>
          </div>
          <div className="silverbullet-push-footer"></div>
        </div>
        <div className="silverbullet-footer-wrapper">
          <div className="silverbullet-export-wrapper">
            <div className="silverbullet-export-button" id="silverbullet-export-png">
              <p onClick={this.catchPngExportClick.bind(this)}>Export SVG</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // RENDER ends

}
