/* global document */
import React from 'react';
// import Dthree from 'd3';
// Context components -- only 'print' so far...
import PrintStyles from '@economist/component-silver-styles-print';
// Editor
import SilverEditor from '@economist/component-silver-editor';
// Operational preferences:
// NOTE: this var needs to be renamed. If it only contains SVG strings
import SilverBulletConfig from './assets/silverbullet_config.json';

export default class SilverBullet extends React.Component {

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
  // Callback for SVG content returned from style-specific component
  // Sets the state flag getSVG off again
  // svgString is the SVG node's content, passed up from the style component
  catchReturnedSvg(svgString) {
    // Assemble an SVG file from boilerplate in Operations
    let svgExport = '';
    // Headers
    for (const head in SilverBulletConfig.svgHeader) {
      svgExport += SilverBulletConfig.svgHeader[head];
    }
    // We need to apply CSS styles to the SVG, so harvest and append them...
    svgExport += this.getChartStyles();
    // Embed content in group with transform down the page
    // (Eventually calculate by chart size...)
    svgExport += SilverBulletConfig.svgTransform;
    // Actual SVG content
    svgExport += svgString;
    // ...and footer
    svgExport += SilverBulletConfig.svgFooter;
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
