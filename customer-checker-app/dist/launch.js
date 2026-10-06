if (window.parent !== window && new URLSearchParams(location.search).has('_sdk')) {
  const script = document.createElement('script');
  script.src = 'https://miro.com/app/static/sdk/v2/miro.js';
  script.onload = () => {
    const open = () => miro.board.ui.openModal({url:'app.html', width:1200, height:850, fullscreen:false});
    miro.board.ui.on('icon:click', open);
    miro.board.ui.on('app_card:open', open);
  };
  script.onerror = () => document.querySelector('#launch-status').textContent = 'Miro could not load the app. Please reopen it.';
  document.head.append(script);
}
