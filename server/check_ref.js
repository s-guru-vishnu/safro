const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function checkRef() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const WalletTransaction = require('./src/models/WalletTransaction');
        const User = require('./src/models/User');

        const ref = '69bb742b8f14ac25841204c8';
        const trans = await WalletTransaction.find({ referenceId: ref });
        log(`Transactions for ref ${ref}: ${trans.length}`);
        for (const t of trans) {
            const user = await User.findById(t.userId);
            log(`- Type: ${t.type}, Amount: ${t.amount}, User: ${user ? user.name : 'Unknown'} (${t.userId})`);
        }

    } catch (err) {
        log('Error: ' + err.toString());
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('check_ref_log.txt', output);
    }
}

checkRef();
