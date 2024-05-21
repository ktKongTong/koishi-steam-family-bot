
import  * as echarts from 'echarts'
import {ECBasicOption} from "echarts/types/src/util/types";

interface Style {
  width: number,
  height: number
}

export const renderChart = (options:ECBasicOption, s?: Style)=> {
  let style = s ?? {
    width: 800,
    height: 400,
  }
  let chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: style.width,
    height: style.height
  });

  chart.setOption(options)
  const svgStr = chart.renderToSVGString();
  chart.dispose();
  chart = null;
  return svgStr
}
