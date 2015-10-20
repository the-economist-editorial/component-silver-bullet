import React from 'react';
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
    return {};
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
    console.log(event.target.value);
  }

  // GET CHART CONTEXT
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

  // RENDER
  // A note on structure. There's an outermost-wrapper to
  // wrap *everything*. Then the mainouter-wrapper holds the main content;
  // and there's a sticky footer-wrapper at the bottom...
  render() {
    const data = this.state.data;
    // Use appropriate CSS over-rides:
    const chartContext = this.getChartContext(data);
    const defaultTextValue = 'Paste data here...';
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
                onChange={this.catchDataChangeEvent}
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
