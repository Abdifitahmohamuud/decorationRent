export const createPaymentLink = async (amount: number, tell: number) => {
    try {

        const res = await sendRequestWaafi("payments/create-link", {
            amount,
            tell
        });
        let resualt: Boolean = false;
        if (res.status === 20001) {
            resualt = true;
        }
        else {
            resualt = false;
        }
        return resualt;
    } catch (error) {
        console.log(error);
    }

}



const sendRequestWaafi = async (endpoint: string, data: any) => {
    const res = await fetch(`https://api.waafi.com/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WAAFI_API_KEY}`
        },
        body: JSON.stringify(data)
    });
    return res.json();
}
