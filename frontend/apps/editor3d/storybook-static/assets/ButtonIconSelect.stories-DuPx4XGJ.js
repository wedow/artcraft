import{j as t}from"./jsx-runtime-BnIj46N_.js";import{r as f}from"./index-CsdIBAqE.js";import{F as g,f as x,a as h}from"./index-BeLTwFsi.js";import{t as S}from"./bundle-mjs-Du4_Do6r.js";import{w as y}from"./decorator-BcxtDL0x.js";function r({options:a,onOptionChange:s}){const[p,m]=f.useState(a[0].value),u=e=>{m(e),s&&s(e)};return t.jsx("div",{className:"flex space-x-1",children:a.map(({value:e,icon:d,text:o})=>t.jsxs("button",{className:S("flex h-8 items-center justify-center rounded-lg border-2 text-sm transition-all duration-150",o?"h-auto w-auto gap-2 px-2.5 py-1":"w-8",p===e?"border-brand-primary bg-ui-panel/[0.3]":"border-transparent hover:bg-ui-panel/[0.4]"),onClick:()=>u(e),children:[t.jsx(g,{icon:d}),o&&t.jsx("span",{className:"text-sm font-medium",children:o})]},e))})}r.__docgenInfo={description:"",methods:[],displayName:"ButtonIconSelect",props:{options:{required:!0,tsType:{name:"Array",elements:[{name:"Option"}],raw:"Option[]"},description:""},onOptionChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:""}}};const b={component:r,parameters:{actions:{handles:["click"]}},decorators:[y]},n={render:()=>t.jsx(r,{onOptionChange:()=>{},options:[{value:"V1",icon:x,text:"Select 1"},{value:"V2",icon:h,text:"Select 2"}]})};var i,c,l;n.parameters={...n.parameters,docs:{...(i=n.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <ButtonIconSelect onOptionChange={() => {}} options={[{
    value: "V1",
    icon: faAngleLeft,
    text: "Select 1"
  }, {
    value: "V2",
    icon: faAngleRight,
    text: "Select 2"
  }]} />
}`,...(l=(c=n.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};const j=["Default"],I=Object.freeze(Object.defineProperty({__proto__:null,Default:n,__namedExportsOrder:j,default:b},Symbol.toStringTag,{value:"Module"}));export{I as B,n as D};
