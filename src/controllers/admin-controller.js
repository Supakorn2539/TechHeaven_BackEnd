const prisma = require("../config/prisma")

exports.getOrderAdmin = async(req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: true, // ดึงข้อมูลของผู้ใช้ที่ทำการสั่งซื้อ
                OrderItems: {
                    include: {
                        product: true // ดึงข้อมูลของสินค้าที่รวมในคำสั่งซื้อแต่ละรายการ
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // เรียงลำดับจากใหม่ไปเก่า
            }
        })
        // res.send("getOrderAdmin")
        // console.log("hihi")
        res.send(orders)
    } catch (err) {
        console.log(err)
        next(err)
        // res.status(500).json({ message: "Server error"})
    }

}

exports.changeOrderStatus = async(req, res, next) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "RETURNED", "EXCHANGED", "COMPLETED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        // ตรวจสอบว่ามี orderId นี้ในระบบหรือไม่
        const order = await prisma.order.findUnique({
            where: {
                id: Number(orderId)
            }
        });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderUpdate = await prisma.order.update({
            where: {
                id: Number(orderId)
            },
            data: {
                status
            }
        });

        res.json({ message: "Order status updated successfully", order: orderUpdate });
    } catch (err) {
        console.error(err);
        // res.status(500).json({ message: "Server error" });
        next(err)
    }
}

exports.deleteOrder = async(req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = await prisma.order.delete({
            where: {
                id: orderId
            }
        });
        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error(err);
        // res.status(500).json({ message: "Server error" });
        next(err)
    }
}

exports.getUser = async(req,res,next) => {
    try {
        const member = await prisma.user.findMany({
            select : {
                id : true,
                email : true,
                role : true,
                profileImage : true,
                dateOfBirth : true,
                firstName : true,
                lastName : true,
                updatedAt : true,
                createdAt : true,
                isActive : true
            }
        })
        res.status(200).json(member)
    } catch (err) {
        console.log(err)
    }
}

exports.updateUser = async(req,res, next) => {
    try {
        const {userId} = req.params
        const {role,isActive} = req.body
        const user = await prisma.user.update({
            where : {
                id : +userId
            },
            data : {
                isActive : isActive,
                role : role
            }
        })
        res.status(200).json(user)
    } catch (err) {
    
        console.log(err)
        next(err)
    }
}

exports.deleteUser = async(req,res,next) => {
    const {userId} = req.params
    try {
    const member = await prisma.user.delete({
        where : {
            id : +userId    
        }
        })    
    } catch (err) {
        console.log(err)
    }
    // res.status(200).json("Delete Successfully")
    next(err)
}


module.exports.createCoupon = async(req,res,next)=> {
    const {title, description, promotionDiscount, discountType, startDate, expirationDate, promotionCode, promotionType, imageUrl} = req.body
    try {
        const haveFile = !!req.file
        let uploadResult = {}
        if(haveFile){
            uploadResult = await cloudinary.uploader.upload(req.file.path,{
                overwrite : true,
            })
        }
        const promotion = await prisma.promotion.create({
            data: {
              title,
              description,
              promotionDiscount,
              discountType,
              startDate: new Date(startDate),
              expirationDate: new Date(expirationDate),
              promotionCode,
              promotionType,
              imageUrl,
            }
    })
    res.status(200).json(promotion)
    } catch (err) {
        next(err)
        console.log(err)
    }
}

module.exports.editCoupon = async(req,res,next) => {
    const { id } = req.params;
  const { title, description, promotionDiscount, discountType, startDate, expirationDate, promotionCode, promotionType, imageUrl } = req.body;

  try {
    const promotion = await prisma.promotion.update({
      where: { id: +id },
      data: {
        title,
        description,
        promotionDiscount,
        discountType,
        startDate: new Date(startDate),
        expirationDate: new Date(expirationDate),
        promotionCode,
        promotionType,
        imageUrl,
      },
    });
    res.status(200).json(promotion);
  } catch (err) {
    console.error(err);
    next(err)

  }
};

module.exports.deleteCoupon = async(req,res,next) => {
    const {id} = req.params
    try {
        await prisma.promotion.delete({
          where: { id: +id },
        });
        res.status(200).send('Coupon deleted successfully');
      } catch (err) {
        console.error(err);
       next(err)
      }
}

module.exports.getCoupon = async(req,res,next)=>{
    try {
        const promotions = await prisma.promotion.findMany();
        res.status(200).json(promotions);
      } catch (err) {
        console.error(err);
       next(err)
      }
}