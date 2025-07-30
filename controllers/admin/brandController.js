const Brand = require('../../models/brandSchema')

const brandInfo = async (req, res) => {
    try {
        const search = req.query.search || "";
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        const query = {}
        if (search) {
            query.brandName = { $regex: search, $options: "i" }
        }

        const totalItems = await Brand.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const brands = await Brand.find(query)
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.render('admin-brand', {
            brands: brands,
            search: search,
            currentPage: currentPage,
            limit: limit,
            totalItems: totalItems,
            totalPages: totalPages
        })

    } catch (error) {
        console.error('Error fetching category info:', error);
        res.status(500).send('Server Error');
    }
}

const addBrand = async (req, res) => {
    try {
        const { brandName, imageUrl, discounts, status } = req.body
        console.log(req.body)

        if (!brandName || !imageUrl) {
            res.status(400).json({ success: false, message: "Brand Name and Image are required." })
        }

        const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${brandName}`, 'i') } })
        if (existingBrand) {
            res.status(409).json({ success: false, message: "Brand with this name exists" })
        }

        const newBrand = new Brand({
            brandName: brandName,
            brandImage: imageUrl,
            discount: discounts,
            status: status,
        })

        await newBrand.save()
        res.status(201).json({ success: true, message: "Brand added successfully" })

    } catch (error) {
        console.error('Error adding brand:', error);
        res.status(500).json({ success: false, message: 'Failed to add brand.' });
    }
}

const editBrand = async (req, res) => {
    try {
        const { id } = req.params
        const { brandName, imageUrl, discounts, status } = req.body
        console.log(id)
        console.log(req.body)

        const updateBrand = await Brand.findByIdAndUpdate(id, {
            brandName: brandName,
            brandImage: imageUrl,
            discount: discounts,
            status,
        }, { new: true })

        if(!updateBrand){
            res.status(404).json({success:false,message:"Brand Not Found"})
        }

        res.json({success:true,message:"Brand Updated Successfully"})

    } catch (error) {
        console.error('Error updating brand');
        res.status(500).json({success:false,message:"Failed to update Brand."})
    }
}

module.exports = {
    brandInfo,
    addBrand,
    editBrand,
}