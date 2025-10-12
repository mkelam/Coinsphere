# Activity-Level Tracking Workflow
**BMad Workflow for Maintaining Project Completion Plan**

---

## PURPOSE

This workflow ensures all code changes, completions, and updates are properly reflected in the Activity-Level Completion Plan (`/Documentation/ACTIVITY_LEVEL_COMPLETION_PLAN.md`).

---

## WHEN TO USE THIS WORKFLOW

1. **After completing any development task**
2. **When merging/committing code that affects project completion**
3. **During sprint reviews or status updates**
4. **Before stakeholder presentations**
5. **When user requests progress update**

---

## WORKFLOW STEPS

### STEP 1: Identify Changed Activities

**Trigger:** Code commit, task completion, or status request

**Actions:**
1. Review what was changed/completed
2. Map changes to Activity IDs in the plan
3. List all affected activities (e.g., ML-001, PORT-006)

**Example:**
```
Code Change: Completed edit holdings route
Maps to: PORT-006 (Edit Holdings)
```

---

### STEP 2: Read Current Activity Status

**Actions:**
1. Open `/Documentation/ACTIVITY_LEVEL_COMPLETION_PLAN.md`
2. Find the relevant Activity ID
3. Note current % completion, status, and hours remaining

**Example:**
```
Current Status:
| PORT-006 | Edit Holdings | 90% | ⚠️ In Progress | 4 | Service exists, route incomplete | Oct 12, 2025 |
```

---

### STEP 3: Calculate New Completion %

**Guidelines:**

**For code-based activities:**
- 0% = Not started
- 25% = Basic structure/scaffolding
- 50% = Core logic implemented
- 75% = Functional but needs testing/polish
- 90% = Complete but minor issues
- 100% = Fully done, tested, documented

**Evidence-based estimation:**
- Backend route + service + tests = 100%
- Backend route + service (no tests) = 90%
- Backend route only = 60%
- Service only = 40%
- Scaffolding only = 25%

**For infrastructure activities:**
- 0% = No files exist
- 50% = Configuration files exist
- 75% = Working locally
- 100% = Working in production

---

### STEP 4: Update Activity Entry

**Actions:**
1. Update % completion column
2. Update status emoji:
   - 🔴 Not Started (0%)
   - ⚠️ In Progress (1-99%)
   - ✅ Complete (100%)
3. Update "Hrs Left" estimate
4. Update "Evidence" with file paths or proof
5. Update "Last Updated" to today's date

**Example Update:**
```markdown
Before:
| PORT-006 | Edit Holdings | 90% | ⚠️ In Progress | 4 | Service exists, route incomplete | Oct 12, 2025 |

After:
| PORT-006 | Edit Holdings | 100% | ✅ Complete | 0 | `/backend/src/routes/holdings.ts:45-89`, tests pass | Oct 15, 2025 |
```

---

### STEP 5: Update Category Totals

**Actions:**
1. Recalculate category completion:
   - Sum all activity percentages in category
   - Divide by number of activities
   - Update category header

**Example:**
```
Portfolio Management:
- 9 activities
- Total completion: (100+100+100+100+100+100+90+100+100)/9 = 96.67%
- Round to: 96%
```

Update table:
```markdown
| **Portfolio Management** | 8.7 | 9 | **97%** | ✅ Near Complete |
```

---

### STEP 6: Update Overall Completion

**Actions:**
1. Sum all activity completions across all categories
2. Divide by total activities (65)
3. Update "Overall Completion" at top of document

**Formula:**
```
Overall % = (Sum of all activity %) / 65
```

**Example:**
```
Total: 56.75 activities complete
Overall: 56.75/65 = 87.4%
```

Update header:
```markdown
**Overall Completion:** 87.4% (56.75/65 activities)
```

---

### STEP 7: Update Critical Path (if applicable)

**Actions:**
1. If completed activity was in Critical Path section:
   - Remove from HIGH/MEDIUM/LOW priority tables
   - Adjust remaining hours
   - Update blocking status

**Example:**
```markdown
Before:
| PORT-006/007 | Edit/Remove Holdings UI | 7 | Portfolio mgmt | Frontend |

After:
| PORT-007 | Remove Holdings UI | 3 | Portfolio mgmt | Frontend |
```

---

### STEP 8: Add Change Log Entry

**Actions:**
1. Scroll to bottom of document (Change Log section)
2. Add new row with:
   - Today's date
   - Activity ID
   - Description of change
   - Old %
   - New %
   - Your name/role

**Format:**
```markdown
| Date | Activity ID | Change | Old % | New % | Updated By |
|------|------------|--------|-------|-------|------------|
| Oct 15, 2025 | PORT-006 | Completed edit holdings route with tests | 90% | 100% | Dev Team |
```

---

### STEP 9: Update Visualizations

**Actions:**
1. Update progress bar in "Progress Visualization" section
2. Recalculate category bars if category % changed

**Example:**
```
Portfolios     ██████████████████████████████████████░░  97%  (was 96%)
```

---

### STEP 10: Save and Commit

**Actions:**
1. Save `/Documentation/ACTIVITY_LEVEL_COMPLETION_PLAN.md`
2. Commit with descriptive message:
   ```
   docs: Update activity plan - PORT-006 complete (97% category, 87.8% overall)
   ```

---

## AUTOMATION OPPORTUNITIES

### For BMad Orchestrator:

**When user says:**
- "I completed [task]"
- "Update the plan"
- "Mark [activity] as done"
- "Reflect this change in the plan"

**BMad should:**
1. Ask: "Which Activity ID does this relate to?"
2. Ask: "What % complete is it now?"
3. Ask: "What files/evidence prove completion?"
4. Execute this workflow automatically
5. Show user the before/after status

**Example Interaction:**
```
User: "I just finished the edit holdings feature"
BMad: "Great! That's Activity PORT-006. What % complete would you say it is? (Current: 90%)"
User: "100%, all tests pass"
BMad: "Perfect! What files should I list as evidence?"
User: "/backend/src/routes/holdings.ts and the test file"
BMad: [Executes workflow, updates document]
BMad: "✅ Updated! PORT-006 is now 100% complete. Portfolio Management category increased from 96% to 97%. Overall project is now 87.8% complete."
```

---

## WEEKLY AUDIT CHECKLIST

**Every Monday, PM John should:**

- [ ] Review all "In Progress" activities
- [ ] Verify % completion matches actual code
- [ ] Update any stale "Last Updated" dates
- [ ] Check if any activities should be added/removed
- [ ] Validate category totals are correct
- [ ] Validate overall % is correct
- [ ] Review Critical Path for priority changes
- [ ] Update Change Log if bulk changes made

---

## SPRINT REVIEW CHECKLIST

**End of each sprint:**

- [ ] Full audit of all 65 activities
- [ ] Verify evidence links are valid
- [ ] Update all stale dates
- [ ] Recalculate all category percentages
- [ ] Recalculate overall completion
- [ ] Update Critical Path based on new priorities
- [ ] Generate progress report for stakeholders
- [ ] Archive old Change Log entries if >20 rows

---

## STAKEHOLDER REPORTING CHECKLIST

**Before presenting to stakeholders:**

- [ ] Ensure document is up-to-date (within 24 hours)
- [ ] Validate all percentages are accurate
- [ ] Prepare summary of completed activities since last report
- [ ] Highlight any at-risk activities (behind schedule)
- [ ] Update visualizations for clarity
- [ ] Generate before/after comparison if applicable

---

## QUALITY CHECKS

### Red Flags (Indicates Inaccurate Tracking):

⚠️ **Warning Signs:**
- Activity at 90%+ for >1 week without changing
- "Last Updated" date >2 weeks old
- Evidence is "TBD" or vague
- Hours remaining hasn't changed for completed work
- Category % doesn't match sum of activities
- Overall % doesn't match sum of categories

**If you see these, trigger a full audit!**

---

## AGENT RESPONSIBILITY

### PM John:
- Owns the Activity-Level Completion Plan
- Conducts weekly audits
- Updates during sprint reviews
- Generates stakeholder reports

### Dev Agent:
- Updates after completing code tasks
- Provides evidence (file paths)
- Estimates remaining hours

### QA Agent:
- Validates completion claims
- Verifies tests pass before marking 100%
- Challenges inflated percentages

### BMad Orchestrator:
- Facilitates updates when requested
- Automates workflow execution
- Reminds agents to update
- Runs quality checks

---

## EXAMPLE: COMPLETE WORKFLOW EXECUTION

**Scenario:** Developer completes Hostinger VPS Deployment

**STEP 1:** Identify
- Activity: INFRA-005 (Hostinger VPS Deployment)

**STEP 2:** Read Current Status
```
| INFRA-005 | Hostinger VPS Deployment | 0% | 🔴 Not Started | 12 | **MISSING** | Oct 12, 2025 |
```

**STEP 3:** Calculate New %
- VPS provisioned and SSH configured: +30%
- Docker installed and containers running: +30%
- Domain pointed to VPS: +20%
- SSL certificate installed: +20%
- Total: 100%

**STEP 4:** Update Entry
```
| INFRA-005 | Hostinger VPS Deployment | 100% | ✅ Complete | 0 | VPS live at coinsphere.app, Docker running, SSL active | Oct 15, 2025 |
```

**STEP 5:** Update Category
- Infrastructure: 47% → 64% (INFRA-005 went from 0% to 100%)

**STEP 6:** Update Overall
- Overall: 87.4% → 89% (gained 1.6%)

**STEP 7:** Update Critical Path
- Remove INFRA-005 from LOW PRIORITY (was 12 hours)
- LOW PRIORITY: 36 hours → 24 hours

**STEP 8:** Add Change Log
```
| Oct 15, 2025 | INFRA-005 | Completed Hostinger VPS deployment with Docker and SSL | 0% | 100% | DevOps Team |
```

**STEP 9:** Update Visualization
```
Infrastructure ██████████████████████████░░░░░░░░░░░░░  64%  (was 47%)
Overall        ██████████████████████████████████████░░  89%  (was 87.4%)
```

**STEP 10:** Commit
```bash
git add Documentation/ACTIVITY_LEVEL_COMPLETION_PLAN.md
git commit -m "docs: INFRA-005 complete - Hostinger VPS deployed (89% overall)"
```

---

## QUICK REFERENCE COMMANDS

For BMad Orchestrator to use:

- `*update-activity [ID] [%]` - Quick update an activity
- `*audit-plan` - Run full quality check
- `*show-progress` - Display current overall %
- `*critical-path` - Show remaining HIGH priority items
- `*generate-report` - Create stakeholder summary

---

## DOCUMENT MAINTENANCE

**Monthly:**
- Archive change log if >50 entries (keep last 20)
- Review if new activities need to be added
- Remove deprecated activities
- Update "Last Audit" date at bottom

**Quarterly:**
- Full category restructure if needed
- Update success criteria if changed
- Review launch readiness thresholds

---

## SUCCESS METRICS

**This workflow is successful if:**

✅ Activity-Level Completion Plan is always <24 hours out of date
✅ All "In Progress" activities have accurate %
✅ Change Log has entries from last 7 days
✅ No "Last Updated" dates >14 days old
✅ Category % match sum of activities (within 1%)
✅ Overall % matches sum of categories (within 1%)
✅ Stakeholders trust the data for decision-making

---

**Workflow Version:** 1.0
**Created:** October 12, 2025
**Owner:** BMad Orchestrator
**Maintained By:** PM John
