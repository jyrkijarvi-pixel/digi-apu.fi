'use strict';
// DOM rendering uses textContent only. No answer leaves this page.
document.querySelectorAll('[data-guidance]').forEach(host => {
  const flow = host.dataset.guidance;
  let state = DigiGuidance.start(flow);
  const mount = host.querySelector('.guidance-content');
  const back = host.querySelector('[data-back]');
  const reset = host.querySelector('[data-restart]');
  const progress = host.querySelector('[data-progress]');
  const append = (tag,text,parent=mount) => {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
  };
  function render(focus=false) {
    const node = DigiGuidance.current(state);
    mount.replaceChildren();
    const question = node.kind === 'question';
    progress.textContent = question ? `Vaihe ${state.trail.length+1}` : 'Toimintaohjeesi';
    host.dataset.urgent = String(node.tone === 'urgent');
    const heading = append('h3',question?node.question:node.title);
    heading.tabIndex = -1;
    if (question) {
      append('p',node.help);
      const options=append('div','');
      options.className='guidance-options';
      for (const item of node.options) {
        const button=append('button',item.label,options);
        button.type='button';
        button.className='button secondary';
        button.addEventListener('click',()=>{ state=DigiGuidance.advance(state,item.id); render(true); });
      }
    } else {
      if (node.intro) append('p',node.intro);
      if (node.steps.length) {
        const list=append('ol','');
        node.steps.forEach(text=>append('li',text,list));
      }
      if (node.recommendations && node.recommendations.length) {
        const list=append('ul','');
        node.recommendations.forEach(item=>{
          const row=append('li',item.text+' ',list);
          const link=append('a','Katso ohje',row);
          link.href=item.url;
        });
      }
      append('p',node.limit || 'Ohje perustuu valitsemiisi vastauksiin. Sivusto ei tutki viestiä, linkkiä tai laitettasi eikä vahvista niiden turvallisuutta.').className='guidance-limit';
      if (node.refs.length) {
        append('h4','Lähteet ja lisäohjeet');
        const list=append('ul','');
        list.className='guidance-sources';
        node.refs.forEach(([label,url])=>{const li=append('li','',list);const a=append('a',label+' ↗',li);a.href=url;a.rel='noreferrer';});
      }
    }
    back.disabled=state.trail.length===0;
    if(focus) heading.focus();
  }
  back.addEventListener('click',()=>{state=DigiGuidance.back(state);render(true);});
  reset.addEventListener('click',()=>{state=DigiGuidance.start(flow);render(true);});
  render();
  host.hidden=false;
});
