const cron = require("node-cron");
const Medicine = require("../models/medicine.model");
const Admin = require("../models/admin.model");
const { sendEmail } = require("./sendEmail");

const startCronJobs = () => {
  // Run daily at midnight '0 0 * * *'
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily inventory expiry check...");

    try {
      const now = new Date();
      // Calculate date 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Find medicines expiring within 30 days
      const expiringMedicines = await Medicine.find({
        expiryDate: { $lte: thirtyDaysFromNow.toISOString() },
      });

      if (expiringMedicines.length > 0) {
        // Fetch all admins
        const admins = await Admin.find({ role: "admin" }).select("email");
        const adminEmails = admins.map((a) => a.email);

        if (adminEmails.length > 0) {
          let rowsHtml = expiringMedicines
            .map((med) => {
              const expiryDate = new Date(med.expiryDate).toLocaleDateString();
              const isExpired = new Date(med.expiryDate) < now;
              const statusColor = isExpired ? "#DC2626" : "#D97706";
              const statusText = isExpired ? "EXPIRED" : "Expiring Soon";

              return `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${med.medicineName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${med.batchNumber}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: ${statusColor}; font-weight: bold;">${expiryDate} (${statusText})</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${med.quantity}</td>
              </tr>
            `;
            })
            .join("");

          const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
              <h2 style="color: #111827;">MedTrack Daily Expiry Report</h2>
              <p>The following medications are either expired or will expire within the next 30 days. Please take immediate action to manage this inventory.</p>
              <table style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #F3F4F6;">
                    <th style="padding: 10px; border-bottom: 2px solid #D1D5DB;">Medicine Name</th>
                    <th style="padding: 10px; border-bottom: 2px solid #D1D5DB;">Batch</th>
                    <th style="padding: 10px; border-bottom: 2px solid #D1D5DB;">Expiry Date</th>
                    <th style="padding: 10px; border-bottom: 2px solid #D1D5DB;">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
              <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">Automated daily alert from MedTrack System.</p>
            </div>
          `;

          await sendEmail(
            adminEmails.join(","),
            html,
            "⚠️ Daily Alert: Medications Expiring Soon"
          );
          console.log(`Sent expiry alert for ${expiringMedicines.length} medicines.`);
        }
      } else {
        console.log("No medicines expiring within 30 days today.");
      }
    } catch (error) {
      console.error("Error running daily cron job:", error);
    }
  });

  console.log("✅ Cron jobs scheduled.");
};

module.exports = { startCronJobs };
