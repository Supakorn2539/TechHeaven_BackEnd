const prisma = require("../config/prisma");
const createError = require("../utils/createError");


module.exports.createCart = async (req, res, next) => {
    console.log("Show Item", req.body);
    const { item } = req.body;
    const { id } = req.user;
  // console.log(req.body)
  try {
    const existCart = await prisma.cart.findFirst({
      where: { userId: id },
    });

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: id,
        },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        userId: id,
      },
    });

    let products = item.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }));
    console.log("Products", products);

    let total = products.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    console.log("Total", total);

    const newCart = await prisma.cart.create({
        data: {
            CartItems: {
                create: products,
            },
            total: total,
            userId: id,
            status: "PENDING",
        }
    })
    res.send(newCart);
  } catch (err) {
    console.log(err)
    next(err);
  }
};

module.exports.updateCartItem = async (req, res, next) => {
    try {
        const { cartItemId } = req.params;
        const { quantity, price } = req.body;

        const total = quantity * price;
        const updateCartItem = await prisma.cartItem.update({
            where: {
                id: +cartItemId
            },
            data: {
                quantity: quantity,
                total: total
            }
        });
        const { cartId } = updateCartItem;
        const { _sum } = await prisma.cartItem.aggregate({
            _sum: {
                total: true
            },
            where: {
                cartId: cartId
            }
        });

        await prisma.cart.update({
            where: { id: cartId },
            data: { total: _sum.total || 0 }
        });

        res.json({ message: "Cart item updated successfully", updateCartItem });
    } catch (err) {
        next(err);
        console.log(err);
    }
};

module.exports.getCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const cart = await prisma.cart.findFirst({
            where: {
                userId: +userId,
                status: "PENDING"
            },
            include: {
                CartItems: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!cart) {
            return res.status(200).json({ cart: null }); // ถ้าไม่มี cart ให้ส่ง null
        }
        res.status(200).json({ cart });
    } catch (err) {
        next(err);
        console.log(err);
    }
};

module.exports.deleteCartItem = async (req, res, next) => {
    try {
        const { cartItemId } = req.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: {
                id: +cartItemId
            }
        });
        if (!cartItem) {
            return createError(404, "Cart Item not Found");
        }
        const cartId = cartItem.cartId;
        await prisma.cartItem.delete({
            where: {
                id: +cartItemId
            }
        });

        const { _sum } = await prisma.cartItem.aggregate({
            _sum: {
                total: true
            },
            where: {
                cartId: cartId
            }
        });
        await prisma.cart.update({
            where: {
                id: cartId
            },
            data: {
                total: _sum.total || 0
            }
        });
        res.status(200).json({ message: `Deleted item ${cartItemId} successfully` });
    } catch (err) {
        next(err);
        console.log(err);
    }
};

module.exports.addToCart = async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user.id;

    console.log("Adding to cart for user:", userId, "with productId:", productId);

    try {
        const existCart = await prisma.cart.findFirst({
            where: { userId: userId, status: "PENDING" },
        });

        if (!existCart) {
            const newCart = await prisma.cart.create({
                data: {
                    userId: userId,
                    status: "PENDING",
                },
            });

            // สร้าง cart item ใหม่
            await prisma.cartItem.create({
                data: {
                    cartId: newCart.id,
                    productId: productId,
                    quantity: 1,
                },
            });
        } else {
            // ถ้ามี cart อยู่แล้ว ให้เพิ่มหรืออัปเดต cart item
            const existingCartItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: existCart.id,
                    productId: productId,
                },
            });

            if (existingCartItem) {
                // ถ้ารายการมีอยู่แล้ว ให้เพิ่มจำนวนสินค้า
                await prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: existingCartItem.quantity + 1 },
                });
            } else {
                // ถ้าไม่มี ให้สร้าง cart item ใหม่
                await prisma.cartItem.create({
                    data: {
                        cartId: existCart.id,
                        productId: productId,
                        quantity: 1,
                    },
                });
            }
        }

        res.status(200).json({ message: "Product added to cart successfully." });
    } catch (err) {
        next(err);
    }
};
