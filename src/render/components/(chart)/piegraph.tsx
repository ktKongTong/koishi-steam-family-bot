/** @jsxImportSource react */
import React from "react";
import {axisStyle, defaultTextStyle, selectableColor} from "./playtimeGraph";
import {renderChart} from "../renderChart";

export function Piegraph({
  countData,
  style
}:{
  countData: any,
style: {height: number, width: number}

}){
  const cntData = countData.map((it:any)=> {
    return [it.name, it.cnt]
  })
  const option = {
    darkMode: true,
    color: selectableColor,
    title: {
      text: '库存数量',
      left: 'center',
      textStyle: {
        color: '#ffffff'
      }
    },

    legend: {
      left: 'center',
      top:'bottom',
      textStyle: defaultTextStyle,
    },
    grid: { left: '55%' },
    xAxis: {
      // gridIndex: 0,
      ...axisStyle,

    },
    yAxis: {
      type: 'category',
      show:false,
      ...axisStyle
    },
    dataset: {
      source: [
        ['name', 'count'],
        ...cntData
      ]
    },
    series: [
      {
        type: 'pie',
        id: 'pie',
        radius: '40%',
        center: ['30%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 10
        },
        label: {
          formatter: '{b}({d}%)',
          textStyle: {
            color:'#ffffff'
          }
        },
        encode: {
          itemName: 'name',
          value: 'count',
        }
      },

      ...cntData.map((it:any)=> ({
        type: 'bar',
        seriesLayoutBy: 'row',
        itemStyle: {
          borderRadius: [0,50,50,0]
        },
        height: '4px',
        label: {
          textStyle: {
            color:'#ffffff'
          },
          show: true,
          position: 'right'
        },
      })),
    ]
  }

  const res = renderChart(option, style)
  return (
    <div dangerouslySetInnerHTML={{
      __html: res
    }}>
    </div>
  )
}
