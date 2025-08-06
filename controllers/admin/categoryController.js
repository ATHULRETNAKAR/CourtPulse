const Category = require('../../models/categorySchema');

const categoryInfo = async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Default limit

        // Build query object for Mongoose
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' }; // Case-insensitive search by name
        }

        // Count total items matching the search query
        const totalItems = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        // Fetch categories from the database with pagination and search
        const categories = await Category.find(query)
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.render('admin-category', {
            categories: categories, // Pass the actual categories from DB
            search: search,
            currentPage: currentPage,
            limit: limit,
            totalItems: totalItems,
            totalPages: totalPages
        });

    } catch (error) {
        console.error('Error fetching category info:', error);
        res.status(500).send('Server Error');
    }
};



const addCategory = async (req, res) => {
    try {
        const { categoryName, description, discounts , status } = req.body;
        console.log(req.body)

        // Basic validation
        if (!categoryName || !description) {
            return res.status(400).json({ success: false, message: 'Category name and description are required.' });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}`, 'i') } });
        if (existingCategory) {
            return res.status(409).json({ success: false, message: 'Category with this name already exists.' });
        }

        const newCategory = new Category({
            name: categoryName,
            description: description,
            discounts: discounts || 0, // Default to 0 if not provided
            status: status // Default to true when adding
        });

        await newCategory.save();
        res.status(201).json({ success: true, message: 'Category added successfully!'});

    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'Failed to add category.' });
    }
};


const editCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const { categoryName, description, discounts, status } = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name:categoryName,
            description,
            discounts,
            status
        }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        res.json({ success: true, message: 'Category updated successfully!'});

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Failed to update category.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; 

        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        res.json({ success: true, message: 'Category deleted successfully!' });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
};


module.exports = {
    categoryInfo,
    addCategory,
    editCategory,
    deleteCategory
}