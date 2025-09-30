import { PatternAnalyzer } from '../src/analyzer/pattern-analyzer';

const analyzer = new PatternAnalyzer();

const testContent = `
# Test Article About CRM Software

Customer relationship management (CRM) software helps businesses manage customer interactions. 
In 2024, the CRM market reached $65 billion globally. Leading solutions include Salesforce, 
HubSpot, and Microsoft Dynamics.

## Key Features

Modern CRM systems provide the following capabilities:
- Contact management with detailed customer profiles
- Sales pipeline tracking with conversion analytics
- Marketing automation with email campaigns
- Customer service ticketing and support workflows

## Benefits

Companies using CRM software report 29% increase in sales productivity. The platform streamlines 
communication across teams and provides actionable insights through data analytics.

### Integration

Most CRM platforms integrate with popular tools like Slack, Gmail, and Zoom. This connectivity 
enables seamless workflow automation and improves team collaboration.

## Conclusion

Implementing a CRM system requires careful planning and training. Organizations should evaluate 
their specific needs before selecting a solution.
`;

const query = 'best CRM software 2024';

const result = analyzer.analyze(testContent, query);

console.log('=== GEO Analysis Results ===\n');
console.log('Overall Score:', result.scores.overall, '/10');
console.log('Extractability:', result.scores.extractability, '/10');
console.log('Readability:', result.scores.readability, '/10');
console.log('Citability:', result.scores.citability, '/10');

console.log('\n=== Metrics ===\n');
console.log('Average Sentence Length:', result.metrics.sentenceLength.average, 'words');
console.log('Claim Density:', result.metrics.claimDensity.current, 'per 100 words');
console.log('Date Markers Found:', result.metrics.dateMarkers.found);
console.log('Heading Count:', result.metrics.structure.headingCount);

console.log('\n=== Top Recommendations ===\n');
result.recommendations.slice(0, 3).forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.method} (${rec.priority} priority)`);
  console.log(`   Expected Impact: +${rec.expectedImpact}%`);
  console.log(`   ${rec.suggestedText}\n`);
});
