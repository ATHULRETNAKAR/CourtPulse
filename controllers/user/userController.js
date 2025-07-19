

const pageNotFound = async(req,res)=>{
    try {
        return res.status(200).render('page-404')
    } catch (error) {
        console.log("Error Page Not Found",error)
        res.status(500).redirect('/pageNotFound')
    }
}


const loadHomepage = async(req,res)=>{
    try {
        return res.status(200).render('home')
    } catch (error) {
        console.log("Home Page Not Found",error);
        res.status(500).send("Internal Server Error")
    }
}

module.exports = {
    loadHomepage,
    pageNotFound
}