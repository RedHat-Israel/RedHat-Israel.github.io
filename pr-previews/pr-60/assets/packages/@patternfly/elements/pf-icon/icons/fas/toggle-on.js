const t = document.createElement('template');t.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" data-icon-name="toggle-on" height="512" width="576" viewBox="0 0 576 512"><path d="M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zm192 96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" /></svg>`;export default t.content.cloneNode(true);