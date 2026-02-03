// Reserved for future enhancements
// Example: smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(anchor.getAttribute('href'))
      .scrollIntoView({ behavior: 'smooth' });
  });
});