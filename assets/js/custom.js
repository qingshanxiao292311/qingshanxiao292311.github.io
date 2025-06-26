document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.post-content a[href^="http"]');
  links.forEach(link => {
    if (link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});