const syntrixa = db.getSiblingDB("syntrixa");

[
  "contact_form_submissions",
  "research_reports",
  "performance_metrics",
  "campaign_plans",
  "content_variants",
  "sales_signals",
  "social_actions",
  "n8n_operational_documents",
].forEach((collectionName) => {
  syntrixa.createCollection(collectionName);
  syntrixa[collectionName].createIndex({ request_id: 1 });
  syntrixa[collectionName].createIndex({ workflow_name: 1 });
  syntrixa[collectionName].createIndex({ created_at: -1 });
});
