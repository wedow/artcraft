import{j as e}from"./jsx-runtime-BnIj46N_.js";import{R as k}from"./index-CsdIBAqE.js";import{t as u}from"./bundle-mjs-Du4_Do6r.js";import{F as H,b as M}from"./index-BeLTwFsi.js";import{L as R,k as f,H as U}from"./utilities-FHh19gKC.js";import{d as F,D as b,e as O}from"./TransitionDialogue-BWOtE-kZ.js";import{w as P}from"./decorator-BcxtDL0x.js";const r=k.forwardRef(({label:s,icon:c,inputClassName:S,className:W,id:i,isError:D,onBlur:l,onFocus:p,errorMessage:m,...q},L)=>e.jsxs("div",{className:u("flex flex-col",W),children:[s&&e.jsx(R,{htmlFor:i||f(s),children:s}),e.jsxs("div",{className:"relative w-full",children:[c&&e.jsx(H,{icon:c,className:"absolute h-5 pl-3 pt-2.5"}),e.jsx("input",{ref:L,id:i||(s?f(s):void 0),className:u("h-10 w-full rounded-md bg-brand-secondary px-3 py-2.5 text-white outline-none","outline-offset-0 transition-all duration-150 ease-in-out focus:outline-brand-primary",c&&"pl-12",D&&"outline-red focus:outline-red",S),onFocus:d=>{p&&p(d),F(b.INPUT)},onBlur:d=>{l&&l(d),O(b.INPUT)},...q}),m&&e.jsx(U,{className:"absolute z-10 text-red",children:m})]})]}));r.displayName="Input";r.__docgenInfo={description:"",methods:[],displayName:"Input",props:{inputClassName:{required:!1,tsType:{name:"string"},description:""},label:{required:!1,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"IconDefinition"},description:""},isError:{required:!1,tsType:{name:"boolean"},description:""},errorMessage:{required:!1,tsType:{name:"string"},description:""}}};const z={component:r,parameters:{actions:{handles:["change","blur","focus"]}},decorators:[P]},a={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(r,{placeholder:"field placeholder"})})},o={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(r,{icon:M})})},t={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(r,{label:"Input label"})})},n={render:()=>e.jsx("div",{className:"bg-action p-8",children:e.jsx(r,{errorMessage:"Error message"})})};var h,g,x;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Input placeholder="field placeholder" />
    </div>
}`,...(x=(g=a.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var I,j,v;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Input icon={faUser} />
    </div>
}`,...(v=(j=o.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};var N,y,w;t.parameters={...t.parameters,docs:{...(N=t.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Input label="Input label" />
    </div>
}`,...(w=(y=t.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var T,_,E;n.parameters={...n.parameters,docs:{...(T=n.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <div className="bg-action p-8">
      <Input errorMessage="Error message" />
    </div>
}`,...(E=(_=n.parameters)==null?void 0:_.docs)==null?void 0:E.source}}};const A=["Default","WithIcon","WithLabel","WithError"],X=Object.freeze(Object.defineProperty({__proto__:null,Default:a,WithError:n,WithIcon:o,WithLabel:t,__namedExportsOrder:A,default:z},Symbol.toStringTag,{value:"Module"}));export{a as D,X as I,o as W,t as a,n as b};
