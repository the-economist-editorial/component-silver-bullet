import React from 'react';
// Context components -- only 'print' so far...
import PrintStyles from '@economist/component-silver-styles-print';
// Editor
import SilverEditor from '@economist/component-silver-editor';
// Operational preferences:
// NOTE: this var needs to be renamed. If it only contains SVG strings
import SilverBulletConfig from './assets/silverbullet_config.json';
// External function for SVG-specific stuff:
import SvgExport from './svgexport';

export default class SilverBullet extends React.Component {

  // *** REACT STUFF ***

  // PROP TYPES
  static get propTypes() {
    return {
      test: React.PropTypes.string,
    };
  }
  // PROP TYPES ends

  // DEFAULT PROPS
  // props.silverBullet is a flag that MIGHT determine whether we work
  // with user-set dimensions, or (in an eventual 'live' widget)
  // window size...
  // NOTE: so we might need to set an aspect-ratio in the eventual
  // config file...
  // If we go the 'full SVG' route, this is presumably redundant...
  static get defaultProps() {
    return {
      silverBullet: true,
    };
  }
  // DEFAULT PROPS ends


  // CONSTRUCTOR
  // Set default state
  // NOTE: this thing may have more STATE than it needs...
  constructor(props) {
    super(props);
    this.state = {
      // Set flag for SVG retrieval to default false
      getSvg: false,
      // Flag that prevents first chart render, so
      // that only Editor renders at mount...
      canRenderChart: false,
      contextString: SilverBulletConfig.defaultContext,
    };
  }
  // CONSTRUCTOR ends

  // *** REACT STUFF ENDS ***

  // *** EVENT CATCHERS ***

  // FIELD CONFIG FROM EDITOR
  // Callback passed to Editor, catches updated config object and sets state...
  // canRenderChart flag allows chart to render...
  fieldConfigFromEditor(config) {
    this.setState({ config, canRenderChart: true });
  }
  // FIELD CONFIG FROM EDITOR ends

  // CATCH EXPORT-PNG CLICK
  // When user clicks the EXPORT button, the state flag getSvg is set to true,
  // precipitating a re-render that passes down the request for the SVG content
  catchPngExportClick() {
    this.setState({ getSvg: true });
  }
  // CATCH EXPORT-PNG CLICK ends

  // CATCH RETURNED SVG
  // Callback for SVG content returned from style-specific component.
  // Calls external function in svgexport.es6 module to process and download SVG.
  // Sets the state flag getSVG off again
  // Arg is the SVG node's content, passed up from the style component
  catchReturnedSvg(svgString) {
    // Config object
    const svgConfig = SilverBulletConfig.svg;
    // External function
    SvgExport(svgString, svgConfig);
    // Reset flag... until the next time...
    this.setState({ getSvg: false });
  }
  // CATCH RETURNED SVG ends

  // *** EVENT CATCHERS END ***

  // GET CHART CONTEXT
  // Called from render
  // Extracts context string ('print', etc) from data and
  // returns the appropriate child component as JSX
  // Passed props are the data object; the getSVG flag;
  // and the callback to which svg content is returned
  getChartContext(config, getSvg) {
    // By default, on mount, return empty div (no chart)
    let cJsx = <div/>;
    // Thereafter, construct context-specific child
    if (this.state.canRenderChart) {
      const contextStr = config.context;
      // More cases to come, as other contexts introduced...
      switch (contextStr) {
        case 'print':
          cJsx = <PrintStyles config={config} getSvg={getSvg} passSvg={this.catchReturnedSvg.bind(this)}/>;
          break;
        default:
          cJsx = <div/>;
      }
    }
    return cJsx;
  }
  // GET CHART CONTEXT ends

  // RENDER
  // A note on structure. There's an outermost-wrapper to
  // wrap *everything*. Then the mainouter-wrapper holds the main content;
  // and there's a sticky footer-wrapper at the bottom...
  render() {
    // Flag to make a request for the SVG drawing
    const getSvg = this.state.getSvg;
    // On startup, config is undefined and getChartContext just returns
    // an empty div, so that nothing displays on the chart area.
    // If Editor has returned a config object, get the context-specific component and draw...
    const config = this.state.config;
    const chartContext = this.getChartContext(config, getSvg);
    // NOTE: does the contextString (line 229) ever get used...?
    return (
      <div className="silverbullet-outermost-wrapper">
        <div className="silverbullet-mainouter-wrapper">
          <div className="silverbullet-maininner-wrapper">
            <div className="silverbullet-chart-wrapper" ref="chartwrapper">
              {chartContext}
            </div>
            <SilverEditor
              contextString = {this.state.contextString}
              passUpdatedConfig={this.fieldConfigFromEditor.bind(this)}
            />
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
