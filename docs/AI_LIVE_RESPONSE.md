# Live methodology response

Prompt: Design an undergraduate phishing URL classification evaluation addressing temporal leakage, baselines, imbalance and reproducibility; no results exist yet.

**Research Question**  
How accurately can a lexical URL classifier identify phishing attacks when evaluated strictly on future temporal data without lookahead leakage?

**Data Provenance & Temporal Split**  
Split historical URLs chronologically using true observation timestamps (e.g., Train: Months 1–4, Validation: Month 5, Test: Month 6). Do not use domain registration dates as a proxy for observation timestamps. Extract features (lexical n-grams, URL entropy) and baseline queries using strictly the information available at historical decision time $T$. Do not use current blocklists, as they leak future labels. If historical timestamps for dynamic features (e.g., WHOIS/DNS) are missing, limit features to static URL string characteristics and state that temporal claims for dynamic features cannot be established.

**Baselines**  
1. **Historical Blocklist Lookup:** State of public blocklists at time $T$.  
2. **Rule-Based Heuristic:** Regex checks (IP addresses in hostname, suspicious TLDs, hyphen counts).  
3. **Standard Machine Learning:** Logistic Regression or Random Forest on lexical TF-IDF feature vectors.

**Preprocessing, Class Imbalance, & Thresholding**  
* **Fit/Transform:** Fit all scalers and text vectorizers strictly on the training split; transform validation and test sets.  
* **Imbalance:** Apply class weighting or undersampling *only* within the training set. Preserve the natural temporal class distribution in validation and test sets. Report the observed test set prevalence and explicitly note that real-world operational prevalence may differ.  
* **Threshold Tuning:** Select the classification threshold on validation PR-AUC / F1-score. Evaluate the held-out test set exactly once using this threshold.

**Metrics & Reproducibility**  
Evaluate using Precision, Recall, Precision-Recall AUC (PR-AUC as primary), and ROC-AUC (supplementary). Fix random seeds, log dependencies in a `requirements.txt` file, and script the feature pipeline for deterministic reproduction.