import{j as e}from"./jsx-runtime-BnIj46N_.js";import{t as h}from"./bundle-mjs-Du4_Do6r.js";import{L as g,k as l}from"./utilities-FHh19gKC.js";import{d as T,D as i,e as y}from"./TransitionDialogue-BWOtE-kZ.js";import{w as j}from"./decorator-BcxtDL0x.js";const s=({className:f,label:a,resize:v="vertical",id:n,...x})=>e.jsxs("div",{className:"flex flex-col",children:[a&&e.jsx(g,{htmlFor:n||l(a),children:a}),e.jsx("textarea",{id:n||(a?l(a):void 0),className:h("rounded-lg border border-ui-panel-border bg-ui-controls px-3 py-2",f),style:{outline:"2px solid transparent",transition:"outline-color 0.15s ease-in-out",resize:v},onFocus:r=>{T(i.INPUT),r.currentTarget.style.outlineColor="#e66462"},onBlur:r=>{y(i.INPUT),r.currentTarget.style.outlineColor="transparent"},onKeyDown:r=>r.stopPropagation(),...x})]});s.__docgenInfo={description:"",methods:[],displayName:"Textarea",props:{label:{required:!1,tsType:{name:"string"},description:""},resize:{required:!1,tsType:{name:"union",raw:`| "none"
| "both"
| "horizontal"
| "vertical"
| "block"
| "inline"
| undefined`,elements:[{name:"literal",value:'"none"'},{name:"literal",value:'"both"'},{name:"literal",value:'"horizontal"'},{name:"literal",value:'"vertical"'},{name:"literal",value:'"block"'},{name:"literal",value:'"inline"'},{name:"undefined"}]},description:"",defaultValue:{value:'"vertical"',computed:!1}}}};const N={component:s,parameters:{actions:{handles:["change","blur","focus"]}},decorators:[j]},o={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(s,{placeholder:"field placeholder"})})},t={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(s,{label:"Label"})})};var c,d,p;o.parameters={...o.parameters,docs:{...(c=o.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Textarea placeholder="field placeholder" />
    </div>
}`,...(p=(d=o.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,u,b;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Textarea label="Label" />
    </div>
}`,...(b=(u=t.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};const _=["Default","WithLabel"],S=Object.freeze(Object.defineProperty({__proto__:null,Default:o,WithLabel:t,__namedExportsOrder:_,default:N},Symbol.toStringTag,{value:"Module"}));export{o as D,S as T,t as W};
