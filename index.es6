import React from 'react';
import Dthree from 'd3';
import PrintStyles from '@economist/component-silver-styles-print';
// const customData = require('./assets/data.json');
export default class SilverBullet extends React.Component {

  // PROP TYPES
  static get propTypes() {
    return {
      data: React.PropTypes.object.isRequired,
      test: React.PropTypes.string,
    };
  }
  // PROP TYPES ends

  // DEFAULT PROPS
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
    };
  }
  // DEFAULT PROPS ends

  // CONSTRUCTOR
  //    bind handleResize to this component
  //    set default state
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
    };
  }
  // CONSTRUCTOR ends

  // COMPONENT DID MOUNT
  componentDidMount() {
  }
  // COMPONENT DID MOUNT ends

  catchDataChangeEvent(event) {
    const data = this.state.data;
    const newData = this.tsvToDataArray(event.target.value);
    console.log(newData);
    // const newData = this.parseNewData(event.target.value);
    data.data = newData.data;
    // Rescale (hard-set to x-domain, so far...):
    //         'xDomain': [ 0, 10 ],
    // const xdomain = [ 0, newData.maxVal ];
    // let maxVal = newData.maxVal;
    // for (const i in newData) {
    //   let val = newData[i].value;
    //   // val is a string, so...
    //   if (val.search('.') > -1) {
    //     val = parseFloat(val);
    //   } else {
    //     val = parseInt(val, 10);
    //   }
    //   if (val > maxVal) {
    //     maxVal = val;
    //   }
    // }
    // xdomain.push(parseInt(newData.maxVal, 10));
    data.xDomain = [ 0, newData.maxVal ];
    this.setState({ data });
  }

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

  // PARSE NEW DATA
  // As things stand, data comes in as a string that needs to
  // be parsed into an array of objects (for structure see
  // default props above)
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
  getChartContext(data) {
    const contextStr = data.context;
    switch (contextStr) {
      case 'print':
        return <PrintStyles data={data}/>;
      default:
        return <PrintStyles data={data}/>;
    }
  }
  // GET CHART CONTEXT ends

  // RENDER
  // A note on structure. There's an outermost-wrapper to
  // wrap *everything*. Then the mainouter-wrapper holds the main content;
  // and there's a sticky footer-wrapper at the bottom...
  render() {
    const data = this.state.data;
    // Use appropriate CSS over-rides:
    const chartContext = this.getChartContext(data);
    const defaultTextValue = 'Paste data here\n(Row 1 must include "category" and "value" headers)';
    return (
      <div className="silverbullet-outermost-wrapper">
        <div className="silverbullet-mainouter-wrapper">
          <div className="silverbullet-maininner-wrapper">
            <div className="silverbullet-chart-wrapper">
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
          <div className="silverbullet-export-button">
            <p>Export</p>
          </div>
        </div>
      </div>
    );
  }
  // RENDER ends
}
