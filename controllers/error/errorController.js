
const pageNotFound = (req, res) => {
  res.status(404).render('page-404', { title: 'Page Not Found' });
};

module.exports = {
    pageNotFound
}