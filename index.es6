import React from 'react';
import Dthree from 'd3';
import PrintStyles from '@economist/component-silver-styles-print';

export default class SilverBullet extends React.Component {

  // PROP TYPES
  static get propTypes() {
    return {
      data: React.PropTypes.object.isRequired,
      plausibleincrements: React.PropTypes.array,
      test: React.PropTypes.string,
    };
  }
  // PROP TYPES ends

  // DEFAULT PROPS
  // Some default dull-boring-dull data; and the list of plausible scale increments
  static get defaultProps() {
    return {
      data: {
        'context': 'print',
        'data': [
          { 'category': 'Ten', 'value': 10 },
          { 'category': 'Zero', 'value': 0 },
        ],
        'dimensions': { 'width': 200, 'height': 200 },
        'margins': { 'top': 30, 'right': 30, 'bottom': 30, 'left': 60 },
        'xDomain': [ 0, 10 ],
        'yDomain': [],
        'xOrient': 'bottom',
        'yOrient': 'left',
        'style': 'bars',
      },
      // Plausible scale increments
      plausibleincrements: [ 0.25, 0.5, 1, 2, 3, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000 ],
    };
  }
  // DEFAULT PROPS ends

  // CONSTRUCTOR
  // Set default state
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      getSvg: false,
    };
  }
  // CONSTRUCTOR ends

  // *** EVENT CATCHERS ***

  // CATCH DATA CHANGE EVENT
  // Called from render > textarea > change event
  catchDataChangeEvent(event) {
    const data = this.state.data;
    const newData = this.tsvToDataArray(event.target.value);
    data.data = newData.data;
    const mmiObj = this.getScaleMinMaxIncr(0, newData.maxVal, 5);
    data.xDomain = [ 0, mmiObj.max ];
    this.setState({ data });
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
  catchPngExportClick() {
    // const thisDomNode =  React.findDOMNode(this.refs.chartwrapper);
    // Currently, this returns the contents of the SVG wrapper:
    // thisDomNode.childNodes[0].childNodes[0].childNodes[0].innerHTML
    this.setState({ getSvg: true });
    // debugger;
  }
  // CATCH EXPORT-PNG CLICK ends

  // CATCH RETURNED SVG
  // Callback for SVG content returned from style-specific component
  // Currently just crows. But will eventually do something with it...
  // And sets the svg event flag off again
  catchReturnedSvg(svgString) {
    console.log('Silver bullet got ' + svgString + '... setting the flag off again at the top');
    this.setState({ getSvg: false });
  }
  // CATCH RETURNED SVG ends


  // *** UTILITIES ***

  // TSV TO DATA ARRAY
  // Converts tsv into an array of objects with 'category' and 'value' properties
  // *** CURRENT ASSUMPTION THAT THERE'S JUST ONE SERIES ***
  // Returns an object with data and maxVal properties
  tsvToDataArray(tsv) {
    // Max val and data array to return:
    let maxVal = 0;
    const dArray = [];
    // Convert string to an array (by rows)
    const data = tsv.split(/\r?\n/);
    // Count rows:
    let rLen = data.length;
    // Now turn each 'row' into an array:
    for (let rNo = 0; rNo < rLen; rNo++) {
      data[rNo] = data[rNo].split(/\t/);
    }
    // Count columns:
    const cLen = data[0].length;
    // So now we have an array of arrays...
    // Do we have headers? If not, invent them:
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
        }
      }
      dArray.push(tempObj);
    }
    // Return data (array of objects), maxVal and array of headers
    return { data: dArray, maxVal, headers: headArray };
  }
  // CSV TO JSON ends

  // PARSE NEW DATA WITH D3
  // Not called, but demos D3's tsv.parse method
  parseNewData(dataString) {
    if (dataString.search('category') !== 0) {
      const dataHeaders = 'category\tvalue\n';
      dataString = `${dataHeaders}${dataString}`;
    }
    const data = Dthree.tsv.parse(dataString);
    return data;
  }

  // GET CHART CONTEXT
  // Called from render
  // Extracts context string ('print', etc) from data and
  // returns the appropriate child component as JSX
  // Passed props are the data object; the getSVG flag;
  // and the callback to which svg content is returned
  getChartContext(data, getSvg) {
    const contextStr = data.context;
    switch (contextStr) {
      case 'print':
        return <PrintStyles data={data} getSvg={getSvg} passSvg={this.catchReturnedSvg.bind(this)}/>;
      default:
        return <PrintStyles data={data} getSvg={getSvg} passSvg={this.catchReturnedSvg.bind(this)}/>;
    }
  }
  // GET CHART CONTEXT ends

  // MIN MAX OBJECT
// Passed 3 args: actual min val; actual max val; ideal number of increment-steps
// Returns obj with 3 properties: min, max, increment
getScaleMinMaxIncr(minVal, maxVal, stepNo) {
  const mmObj = {};
  // Array of "acceptable" increments
  const plausibleIncrs = this.props.plausibleincrements;
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
  mmObj.min = min;
  mmObj.max = max;
  mmObj.increment = incr;
  return mmObj;
}
// MIN MAX OBJECT ends


// RENDER
// A note on structure. There's an outermost-wrapper to
// wrap *everything*. Then the mainouter-wrapper holds the main content;
// and there's a sticky footer-wrapper at the bottom...
render() {
  const data = this.state.data;
  const getSvg = this.state.getSvg;
  // Use appropriate CSS over-rides:
  const chartContext = this.getChartContext(data, getSvg);
  const defaultTextValue = 'Paste data here\n(Row 1 must include "category" and "value" headers)';
  return (
    <div className="silverbullet-outermost-wrapper">
      <div className="silverbullet-mainouter-wrapper">
        <div className="silverbullet-maininner-wrapper">
          <div className="silverbullet-chart-wrapper" ref="chartwrapper">
            {chartContext}
          </div>
          <div className="silverbullet-editor-wrapper" data={data}>
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
            <p onClick={this.catchPngExportClick.bind(this)}>Export PNG</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// RENDER ends

}
