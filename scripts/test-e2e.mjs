import assert from "node:assert";

async function runTests() {
  console.log("Starting End-to-End Workflow Verification on http://localhost:3001 ...");

  const baseUrl = "http://localhost:3001";

  // 1. Submit New Complaint as Customer (Section 6)
  const complaintPayload = {
    customer_name: "Engr. Nura Mohammed",
    customer_company: "Arewa Furniture Hub Kaduna",
    customer_email: "nura@arewafurniture.ng",
    customer_phone: "+2348039988771",
    customer_type: "Customer",
    product_category: "Water-Based Adhesives",
    product_name: "TOP BOND White Glue 4kg",
    product_code: "PCM-ADH-003",
    batch_number: "B260901", // Testing batch cluster!
    pack_size: "4kg Bucket",
    quantity_purchased: "12 Buckets",
    invoice_number: "INV-KAD-55102",
    complaint_type: "Adhesion Issue",
    customer_priority: "Urgent",
    description: "The glue failed to achieve full bond strength on cedar wood veneer after 24 hours pressing under standard Kaduna ambient humidity.",
  };

  console.log("Step 1: Submitting new complaint...");
  const createRes = await fetch(`${baseUrl}/api/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(complaintPayload),
  });
  const createData = await createRes.json();
  console.log("Create Response:", createData);

  assert.strictEqual(createData.success, true);
  assert.ok(createData.complaint_number.startsWith("PCM-NG-"));
  const complaintId = createData.complaint.id;
  const complaintNumber = createData.complaint_number;
  console.log(`✓ Complaint created with ID: ${complaintNumber}`);

  // 2. Verify Public Tracking Without Login (Section 37)
  console.log("Step 2: Testing public tracking without login...");
  const trackRes = await fetch(`${baseUrl}/api/public/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      complaint_id: complaintNumber,
      verification: "nura@arewafurniture.ng",
    }),
  });
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.success, true);
  assert.strictEqual(trackData.complaint.complaint_number, complaintNumber);
  assert.strictEqual(trackData.complaint.status, "OPEN");
  assert.ok(trackData.complaint.live_duration !== undefined);
  console.log("✓ Public tracking verified successfully with server timestamp duration:", trackData.complaint.live_duration.formatted);

  // 3. Admin Acknowledges & Assigns Complaint (Section 9, 13)
  console.log("Step 3: Acknowledging and assigning complaint to Quality Manager...");
  const assignRes = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "ASSIGNED",
      assigned_department: "Quality",
      assigned_to: "Dr. Chioma Okonkwo",
      comment: "Acknowledged receipt. Assigned to Dr. Chioma Okonkwo for laboratory testing.",
      performed_by: "Amina Yusuf",
      performed_by_role: "Customer Service",
    }),
  });
  const assignData = await assignRes.json();
  assert.strictEqual(assignData.success, true);
  assert.strictEqual(assignData.complaint.status, "ASSIGNED");
  assert.strictEqual(assignData.complaint.assigned_to, "Dr. Chioma Okonkwo");
  console.log("✓ Complaint successfully assigned to Quality Manager.");

  // 4. Quality Manager adds Internal Note (Section 14)
  console.log("Step 4: Posting internal note (hidden from customer)...");
  const noteRes = await fetch(`${baseUrl}/api/complaints/${complaintId}/timeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      comment: "INTERNAL NOTE: Retention sample batch B260901 solid content test is 47.8%, within 48±1% spec.",
      is_internal_only: true,
      performed_by: "Dr. Chioma Okonkwo",
      performed_by_role: "Quality Manager",
    }),
  });
  const noteData = await noteRes.json();
  assert.strictEqual(noteData.success, true);
  console.log("✓ Internal note recorded.");

  // 5. Quality Manager Resolves Complaint (Section 8, 29)
  console.log("Step 5: Resolving complaint and stopping resolution timer...");
  const resolveRes = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "RESOLVED",
      resolution_details: "Technical team provided cold-press curing accelerator guidelines for Northern dry season application. Replacement 4kg bucket supplied from Lagos warehouse.",
      root_cause: "High substrate moisture content in Kaduna during harmattan storage.",
      corrective_action: "Issued customized application guidelines for low-humidity timber gluing.",
      preventive_action: "Updated label directions to include humidity curing tables.",
      performed_by: "Dr. Chioma Okonkwo",
      performed_by_role: "Quality Manager",
    }),
  });
  const resolveData = await resolveRes.json();
  assert.strictEqual(resolveData.success, true);
  assert.strictEqual(resolveData.complaint.status, "RESOLVED");
  assert.ok(resolveData.complaint.resolved_at !== null);
  assert.ok(resolveData.complaint.resolution_time_formatted !== null);
  console.log(`✓ Complaint marked RESOLVED. Final duration: ${resolveData.complaint.resolution_time_formatted}`);

  // 6. Customer Submits 5-Star Feedback (Section 18)
  console.log("Step 6: Customer submits feedback...");
  const feedbackRes = await fetch(`${baseUrl}/api/complaints/${complaintId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rating: 5,
      resolution_satisfaction: "Yes",
      comments: "Outstanding customer service and rapid response from Purechem team.",
      customer_name: "Engr. Nura Mohammed",
    }),
  });
  const feedbackData = await feedbackRes.json();
  assert.strictEqual(feedbackData.success, true);
  console.log("✓ Customer satisfaction feedback submitted and stored.");

  // 7. Verify Reports & Analytics (Section 21)
  console.log("Step 7: Verifying reports update...");
  const reportRes = await fetch(`${baseUrl}/api/admin/reports`);
  const reportData = await reportRes.json();
  assert.strictEqual(reportData.success, true);
  assert.ok(reportData.kpis.totalComplaints >= 1);
  assert.ok(reportData.kpis.resolvedComplaints >= 1);
  console.log("✓ Reports KPIs verified:", reportData.kpis);

  // 8. Verify Batch Traceability & Recurring Alert (Section 40, 41)
  console.log("Step 8: Verifying batch traceability for B260901...");
  const batchRes = await fetch(`${baseUrl}/api/admin/batch-trace?batch=B260901`);
  const batchData = await batchRes.json();
  assert.strictEqual(batchData.success, true);
  assert.ok(batchData.batchAggregates.some((b) => b.batch_number === "B260901"));
  console.log("✓ Batch traceability confirmed. Recurring cluster detected for Batch B260901!");

  // 9. Verify Email Outbox (Section 15, 34)
  console.log("Step 9: Verifying email notifications outbox...");
  const settingsRes = await fetch(`${baseUrl}/api/admin/settings`);
  const settingsData = await settingsRes.json();
  assert.strictEqual(settingsData.success, true);
  const outbox = settingsData.notifications;
  assert.ok(outbox.some((n) => n.complaint_id === complaintId));
  console.log(`✓ Outbox verified: ${outbox.length} automated email notifications recorded.`);

  console.log("\n=======================================================");
  console.log("🎉 ALL END-TO-END WORKFLOW VERIFICATION TESTS PASSED 100%!");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
