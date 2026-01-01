// UWorld Systems and Categories Data
// This file contains all system categories for different USMLE/OET exams

const UWORLD_SYSTEMS = {
    // ===== STEP 1 =====
    'step1': [
        {
            id: 'biochemistry',
            name: 'Biochemistry (General Principles)',
            categories: [
                { id: 'amino_acids', name: 'Amino acids, proteins, and enzymes' },
                { id: 'bioenergetics', name: 'Bioenergetics and carbohydrate metabolism' },
                { id: 'cell_molecular', name: 'Cell and molecular biology' },
                { id: 'lipid_metabolism', name: 'Lipid metabolism' },
                { id: 'biochem_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'genetics',
            name: 'Genetics (General Principles)',
            categories: [
                { id: 'clinical_genetics', name: 'Clinical genetics' },
                { id: 'dna_structure', name: 'DNA structure, replication, and repair' },
                { id: 'gene_expression', name: 'Gene expression and regulation' },
                { id: 'protein_synthesis', name: 'Protein synthesis' },
                { id: 'rna_structure', name: 'RNA structure, synthesis, and processing' },
                { id: 'genetics_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'microbiology',
            name: 'Microbiology (General Principles)',
            categories: [
                { id: 'bacteriology', name: 'Bacteriology' },
                { id: 'mycology', name: 'Mycology' },
                { id: 'parasitology', name: 'Parasitology' },
                { id: 'virology', name: 'Virology' },
                { id: 'micro_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'pathology',
            name: 'Pathology (General Principles)',
            categories: [
                { id: 'cellular_pathology', name: 'Cellular pathology' },
                { id: 'inflammation', name: 'Inflammation and repair' },
                { id: 'neoplasia', name: 'Neoplasia' }
            ]
        },
        {
            id: 'pharmacology',
            name: 'Pharmacology (General Principles)',
            categories: [
                { id: 'drug_metabolism', name: 'Drug metabolism and toxicity' },
                { id: 'pharmacodynamics', name: 'Drug receptors and pharmacodynamics' },
                { id: 'pharmacokinetics', name: 'Pharmacokinetics' },
                { id: 'pharm_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'biostatistics',
            name: 'Biostatistics & Epidemiology',
            categories: [
                { id: 'epidemiology', name: 'Epidemiology and population health' },
                { id: 'measures_data', name: 'Measures and distribution of data' },
                { id: 'probability', name: 'Probability and principles of testing' },
                { id: 'study_design', name: 'Study design and interpretation' },
                { id: 'biostats_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'psychiatry_behavioral',
            name: 'Psychiatric/Behavioral & Substance Use Disorder',
            categories: [
                { id: 'normal_behavior', name: 'Normal behavior and development' },
                { id: 'anxiety_trauma', name: 'Anxiety and trauma-related disorders' },
                { id: 'mood_disorders', name: 'Mood disorders' },
                { id: 'neurodevelopmental', name: 'Neurodevelopmental disorders' },
                { id: 'personality_disorders', name: 'Personality disorders' },
                { id: 'psychotic_disorders', name: 'Psychotic disorders' },
                { id: 'substance_use', name: 'Substance use disorders' },
                { id: 'eating_disorders', name: 'Eating disorders' },
                { id: 'somatoform', name: 'Somatoform disorders' },
                { id: 'psych_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'social_sciences',
            name: 'Social Sciences (Ethics/Legal/Professional)',
            categories: [
                { id: 'communication', name: 'Communication and interpersonal skills' },
                { id: 'healthcare_policy', name: 'Healthcare policy and economics' },
                { id: 'medical_ethics', name: 'Medical ethics and jurisprudence' },
                { id: 'patient_safety', name: 'Patient safety' },
                { id: 'quality_improvement', name: 'System based-practice and quality improvement' },
                { id: 'social_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'allergy_immunology',
            name: 'Allergy & Immunology',
            categories: [
                { id: 'anaphylaxis', name: 'Anaphylaxis and allergic reactions' },
                { id: 'autoimmune', name: 'Autoimmune diseases' },
                { id: 'immune_deficiencies', name: 'Immune deficiencies' },
                { id: 'transplant', name: 'Transplant medicine' },
                { id: 'principles_immunology', name: 'Principles of immunology' },
                { id: 'immunology_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'cardiovascular',
            name: 'Cardiovascular System',
            categories: [
                { id: 'normal_cardio', name: 'Normal structure and function of the cardiovascular system' },
                { id: 'aortic_peripheral', name: 'Aortic and peripheral artery diseases' },
                { id: 'arrhythmias', name: 'Cardiac arrhythmias' },
                { id: 'congenital_heart', name: 'Congenital heart disease' },
                { id: 'coronary', name: 'Coronary heart disease' },
                { id: 'heart_failure', name: 'Heart failure and shock' },
                { id: 'hypertension', name: 'Hypertension' },
                { id: 'myopericardial', name: 'Myopericardial diseases' },
                { id: 'valvular', name: 'Valvular heart diseases' },
                { id: 'cardio_drugs', name: 'Cardiovascular drugs' },
                { id: 'cardio_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'dermatology',
            name: 'Dermatology',
            categories: [
                { id: 'normal_skin', name: 'Normal structure and function of skin' },
                { id: 'epidermal_appendages', name: 'Disorders of epidermal appendages' },
                { id: 'inflammatory_derm', name: 'Inflammatory dermatoses and bullous diseases' },
                { id: 'skin_infections', name: 'Skin and soft tissue infections' },
                { id: 'skin_tumors', name: 'Skin tumors and tumor-like lesions' },
                { id: 'derm_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'ent',
            name: 'Ear, Nose & Throat (ENT)',
            categories: [
                { id: 'ent_disorders', name: 'Disorders of the ear, nose, and throat' }
            ]
        },
        {
            id: 'endocrine',
            name: 'Endocrine, Diabetes & Metabolism',
            categories: [
                { id: 'normal_endocrine', name: 'Normal structure and function of endocrine glands' },
                { id: 'congenital_endocrine', name: 'Congenital and developmental anomalies' },
                { id: 'adrenal_disorders', name: 'Adrenal disorders' },
                { id: 'diabetes', name: 'Diabetes mellitus' },
                { id: 'endocrine_tumors', name: 'Endocrine tumors' },
                { id: 'hypothalamus_pituitary', name: 'Hypothalamus and pituitary disorders' },
                { id: 'obesity_dyslipidemia', name: 'Obesity and dyslipidemia' },
                { id: 'reproductive_endocrine', name: 'Reproductive endocrinology' },
                { id: 'thyroid', name: 'Thyroid disorders' },
                { id: 'endocrine_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'female_reproductive',
            name: 'Female Reproductive System & Breast',
            categories: [
                { id: 'normal_female', name: 'Normal structure and function of the female reproductive system and breast' },
                { id: 'congenital_female', name: 'Congenital and developmental anomalies' },
                { id: 'breast_disorders', name: 'Breast disorders' },
                { id: 'genital_tumors', name: 'Genital tract tumors and tumor-like lesions' },
                { id: 'gu_infections', name: 'Genitourinary tract infections' },
                { id: 'menstrual', name: 'Menstrual disorders and contraception' },
                { id: 'female_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'gi',
            name: 'Gastrointestinal & Nutrition',
            categories: [
                { id: 'normal_gi', name: 'Normal structure and function of the GI tract' },
                { id: 'congenital_gi', name: 'Congenital and developmental anomalies' },
                { id: 'biliary', name: 'Biliary tract disorders' },
                { id: 'nutrition', name: 'Disorders of nutrition' },
                { id: 'gastroesophageal', name: 'Gastroesophageal disorders' },
                { id: 'hepatic', name: 'Hepatic disorders' },
                { id: 'intestinal', name: 'Intestinal and colorectal disorders' },
                { id: 'pancreatic', name: 'Pancreatic disorders' },
                { id: 'gi_tumors', name: 'Tumors of the GI tract' },
                { id: 'gi_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'hematology_oncology',
            name: 'Hematology & Oncology',
            categories: [
                { id: 'normal_heme', name: 'Normal hematologic structure and function' },
                { id: 'hemostasis_thrombosis', name: 'Hemostasis and thrombosis' },
                { id: 'plasma_cell', name: 'Plasma cell disorders' },
                { id: 'platelet', name: 'Platelet disorders' },
                { id: 'rbc_disorders', name: 'Red blood cell disorders' },
                { id: 'transfusion', name: 'Transfusion medicine' },
                { id: 'wbc_disorders', name: 'White blood cell disorders' },
                { id: 'oncology_principles', name: 'Principles of oncology' },
                { id: 'heme_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'infectious_diseases',
            name: 'Infectious Diseases',
            categories: [
                { id: 'antimicrobials', name: 'Antimicrobial drugs' },
                { id: 'bacterial_infections', name: 'Bacterial infections' },
                { id: 'fungal_infections', name: 'Fungal infections' },
                { id: 'hiv_sti', name: 'HIV and sexually transmitted infections' },
                { id: 'infection_control', name: 'Infection control' },
                { id: 'parasitic_helminthic', name: 'Parasitic and helminthic infections' },
                { id: 'viral_infections', name: 'Viral infections' },
                { id: 'infectious_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'male_reproductive',
            name: 'Male Reproductive System',
            categories: [
                { id: 'normal_male', name: 'Normal structure and function of the male reproductive system' },
                { id: 'male_disorders', name: 'Disorders of the male reproductive system' }
            ]
        },
        {
            id: 'nervous',
            name: 'Nervous System',
            categories: [
                { id: 'normal_neuro', name: 'Normal structure and function of the nervous system' },
                { id: 'congenital_neuro', name: 'Congenital and developmental anomalies' },
                { id: 'cerebrovascular', name: 'Cerebrovascular disease' },
                { id: 'cns_infections', name: 'CNS infections' },
                { id: 'demyelinating', name: 'Demyelinating diseases' },
                { id: 'peripheral_nerves', name: 'Disorders of peripheral nerves and muscles' },
                { id: 'headache', name: 'Headache' },
                { id: 'neurodegenerative', name: 'Neurodegenerative disorders and dementias' },
                { id: 'seizures', name: 'Seizures and epilepsy' },
                { id: 'spinal_cord', name: 'Spinal cord disorders' },
                { id: 'traumatic_brain', name: 'Traumatic brain injuries' },
                { id: 'nervous_tumors', name: 'Tumors of the nervous system' },
                { id: 'hydrocephalus', name: 'Hydrocephalus' },
                { id: 'anesthesia', name: 'Anesthesia' },
                { id: 'sleep_disorders', name: 'Sleep disorders' },
                { id: 'neuro_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'ophthalmology',
            name: 'Ophthalmology',
            categories: [
                { id: 'normal_eye', name: 'Normal structure and function of the eye and associated structures' },
                { id: 'eye_disorders', name: 'Disorders of the eye and associated structures' }
            ]
        },
        {
            id: 'pregnancy',
            name: 'Pregnancy, Childbirth & Puerperium',
            categories: [
                { id: 'normal_pregnancy', name: 'Normal pregnancy, childbirth, and puerperium' },
                { id: 'pregnancy_disorders', name: 'Disorders of pregnancy, childbirth, and puerperium' }
            ]
        },
        {
            id: 'pulmonary',
            name: 'Pulmonary & Critical Care',
            categories: [
                { id: 'normal_pulm', name: 'Normal pulmonary structure and function' },
                { id: 'congenital_pulm', name: 'Congenital and developmental anomalies' },
                { id: 'critical_care', name: 'Critical care medicine' },
                { id: 'interstitial', name: 'Interstitial lung disease' },
                { id: 'lung_cancer', name: 'Lung cancer' },
                { id: 'obstructive', name: 'Obstructive lung disease' },
                { id: 'pulm_infections', name: 'Pulmonary infections' },
                { id: 'pulm_vascular', name: 'Pulmonary vascular disease' },
                { id: 'sleep_pulm', name: 'Sleep disorders' },
                { id: 'pulm_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'renal',
            name: 'Renal, Urinary Systems & Electrolytes',
            categories: [
                { id: 'normal_renal', name: 'Normal structure and function of the kidneys and urinary system' },
                { id: 'congenital_renal', name: 'Congenital and developmental anomalies' },
                { id: 'aki', name: 'Acute kidney injury' },
                { id: 'bone_metabolism', name: 'Bone metabolism' },
                { id: 'ckd', name: 'Chronic kidney disease' },
                { id: 'cystic_kidney', name: 'Cystic kidney diseases' },
                { id: 'electrolytes', name: 'Fluid, electrolytes, and acid-base' },
                { id: 'glomerular', name: 'Glomerular diseases' },
                { id: 'renal_neoplasms', name: 'Neoplasms of the kidneys and urinary tract' },
                { id: 'nephrolithiasis', name: 'Nephrolithiasis and urinary tract obstruction' },
                { id: 'diabetes_insipidus', name: 'Diabetes insipidus' },
                { id: 'urinary_incontinence', name: 'Urinary incontinence' },
                { id: 'renal_misc', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'rheumatology',
            name: 'Rheumatology/Orthopedics & Sports',
            categories: [
                { id: 'normal_msk', name: 'Normal structure and function of the musculoskeletal system' },
                { id: 'congenital_msk', name: 'Congenital and developmental anomalies' },
                { id: 'arthritis', name: 'Arthritis and spondyloarthropathies' },
                { id: 'autoimmune_msk', name: 'Autoimmune disorders and vasculitides' },
                { id: 'bone_joint_injuries', name: 'Bone/joint injuries and infections' },
                { id: 'bone_tumors', name: 'Bone tumors and tumor-like lesions' },
                { id: 'spinal_disorders', name: 'Spinal disorders and back pain' },
                { id: 'metabolic_bone', name: 'Metabolic bone disorders' },
                { id: 'rheum_misc', name: 'Miscellaneous' }
            ]
        }
    ],

    // ===== STEP 2 CK =====
    'step2ck': [
        {
            id: 'allergy_immunology_ck',
            name: 'Allergy & Immunology',
            categories: [
                { id: 'anaphylaxis_ck', name: 'Anaphylaxis and allergic reactions' },
                { id: 'autoimmune_ck', name: 'Autoimmune diseases' },
                { id: 'immune_deficiencies_ck', name: 'Immune deficiencies' },
                { id: 'transplant_ck', name: 'Transplant medicine' },
                { id: 'principles_immunology_ck', name: 'Principles of immunology' }
            ]
        },
        {
            id: 'biostatistics_ck',
            name: 'Biostatistics & Epidemiology',
            categories: [
                { id: 'epidemiology_ck', name: 'Epidemiology and population health' },
                { id: 'measures_data_ck', name: 'Measures and distribution of data' },
                { id: 'probability_ck', name: 'Probability and principles of testing' },
                { id: 'study_design_ck', name: 'Study design and interpretation' },
                { id: 'biostats_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'cardiovascular_ck',
            name: 'Cardiovascular System',
            categories: [
                { id: 'aortic_peripheral_ck', name: 'Aortic and peripheral artery diseases' },
                { id: 'arrhythmias_syncope_ck', name: 'Cardiac arrhythmias and syncope' },
                { id: 'congenital_heart_ck', name: 'Congenital heart disease' },
                { id: 'coronary_ck', name: 'Coronary heart disease' },
                { id: 'heart_failure_ck', name: 'Heart failure and shock' },
                { id: 'hypertension_ck', name: 'Hypertension' },
                { id: 'myopericardial_ck', name: 'Myopericardial diseases' },
                { id: 'valvular_ck', name: 'Valvular heart diseases' },
                { id: 'cardio_drugs_ck', name: 'Cardiovascular drugs' },
                { id: 'cardio_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'dermatology_ck',
            name: 'Dermatology',
            categories: [
                { id: 'normal_skin_ck', name: 'Normal structure and function of skin' },
                { id: 'epidermal_appendages_ck', name: 'Disorders of epidermal appendages' },
                { id: 'inflammatory_derm_ck', name: 'Inflammatory dermatoses and bullous diseases' },
                { id: 'skin_infections_ck', name: 'Skin and soft tissue infections' },
                { id: 'skin_tumors_ck', name: 'Skin tumors and tumor-like lesions' },
                { id: 'derm_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'ent_ck',
            name: 'Ear, Nose & Throat (ENT)',
            categories: [
                { id: 'ent_disorders_ck', name: 'Disorders of the ear, nose, and throat' }
            ]
        },
        {
            id: 'endocrine_ck',
            name: 'Endocrine, Diabetes & Metabolism',
            categories: [
                { id: 'normal_endocrine_ck', name: 'Normal structure and function of endocrine glands' },
                { id: 'congenital_endocrine_ck', name: 'Congenital and developmental anomalies' },
                { id: 'adrenal_disorders_ck', name: 'Adrenal disorders' },
                { id: 'diabetes_ck', name: 'Diabetes mellitus' },
                { id: 'endocrine_tumors_ck', name: 'Endocrine tumors' },
                { id: 'hypothalamus_pituitary_ck', name: 'Hypothalamus and pituitary disorders' },
                { id: 'obesity_dyslipidemia_ck', name: 'Obesity and dyslipidemia' },
                { id: 'reproductive_endocrine_ck', name: 'Reproductive endocrinology' },
                { id: 'thyroid_ck', name: 'Thyroid disorders' },
                { id: 'endocrine_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'female_reproductive_ck',
            name: 'Female Reproductive System & Breast',
            categories: [
                { id: 'normal_female_ck', name: 'Normal structure and function of the female reproductive system and breast' },
                { id: 'congenital_female_ck', name: 'Congenital and developmental anomalies' },
                { id: 'breast_disorders_ck', name: 'Breast disorders' },
                { id: 'genital_tumors_ck', name: 'Genital tract tumors and tumor-like lesions' },
                { id: 'gu_infections_ck', name: 'Genitourinary tract infections' },
                { id: 'menstrual_ck', name: 'Menstrual disorders and contraception' },
                { id: 'female_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'gi_ck',
            name: 'Gastrointestinal & Nutrition',
            categories: [
                { id: 'normal_gi_ck', name: 'Normal structure and function of the GI tract' },
                { id: 'congenital_gi_ck', name: 'Congenital and developmental anomalies' },
                { id: 'biliary_ck', name: 'Biliary tract disorders' },
                { id: 'nutrition_ck', name: 'Disorders of nutrition' },
                { id: 'gastroesophageal_ck', name: 'Gastroesophageal disorders' },
                { id: 'hepatic_ck', name: 'Hepatic disorders' },
                { id: 'intestinal_ck', name: 'Intestinal and colorectal disorders' },
                { id: 'pancreatic_ck', name: 'Pancreatic disorders' },
                { id: 'gi_tumors_ck', name: 'Tumors of the GI tract' },
                { id: 'gi_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'general_principles_ck',
            name: 'General Principles',
            categories: [
                { id: 'general_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'hematology_oncology_ck',
            name: 'Hematology & Oncology',
            categories: [
                { id: 'hemostasis_thrombosis_ck', name: 'Hemostasis and thrombosis' },
                { id: 'plasma_cell_ck', name: 'Plasma cell disorders' },
                { id: 'platelet_ck', name: 'Platelet disorders' },
                { id: 'rbc_disorders_ck', name: 'Red blood cell disorders' },
                { id: 'transfusion_ck', name: 'Transfusion medicine' },
                { id: 'wbc_disorders_ck', name: 'White blood cell disorders' },
                { id: 'oncology_principles_ck', name: 'Principles of oncology' },
                { id: 'heme_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'infectious_diseases_ck',
            name: 'Infectious Diseases',
            categories: [
                { id: 'antimicrobials_ck', name: 'Antimicrobial drugs' },
                { id: 'bacterial_infections_ck', name: 'Bacterial infections' },
                { id: 'fungal_infections_ck', name: 'Fungal infections' },
                { id: 'hiv_sti_ck', name: 'HIV and sexually transmitted infections' },
                { id: 'infection_control_ck', name: 'Infection control' },
                { id: 'parasitic_helminthic_ck', name: 'Parasitic and helminthic infections' },
                { id: 'viral_infections_ck', name: 'Viral infections' },
                { id: 'infectious_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'male_reproductive_ck',
            name: 'Male Reproductive System',
            categories: [
                { id: 'male_disorders_ck', name: 'Disorders of the male reproductive system' }
            ]
        },
        {
            id: 'multisystem_ck',
            name: 'Miscellaneous (Multisystem)',
            categories: [
                { id: 'multisystem_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'nervous_ck',
            name: 'Nervous System',
            categories: [
                { id: 'normal_neuro_ck', name: 'Normal structure and function of the nervous system' },
                { id: 'congenital_neuro_ck', name: 'Congenital and developmental anomalies' },
                { id: 'cerebrovascular_ck', name: 'Cerebrovascular disease' },
                { id: 'cns_infections_ck', name: 'CNS infections' },
                { id: 'demyelinating_ck', name: 'Demyelinating diseases' },
                { id: 'peripheral_nerves_ck', name: 'Disorders of peripheral nerves and muscles' },
                { id: 'headache_ck', name: 'Headache' },
                { id: 'neurodegenerative_ck', name: 'Neurodegenerative disorders and dementias' },
                { id: 'seizures_ck', name: 'Seizures and epilepsy' },
                { id: 'spinal_cord_ck', name: 'Spinal cord disorders' },
                { id: 'traumatic_brain_ck', name: 'Traumatic brain injuries' },
                { id: 'nervous_tumors_ck', name: 'Tumors of the nervous system' },
                { id: 'hydrocephalus_ck', name: 'Hydrocephalus' },
                { id: 'anesthesia_ck', name: 'Anesthesia/pharmacotherapy' },
                { id: 'sleep_disorders_ck', name: 'Sleep disorders' },
                { id: 'neuro_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'ophthalmology_ck',
            name: 'Ophthalmology',
            categories: [
                { id: 'eye_disorders_ck', name: 'Disorders of the eye and associated structures' }
            ]
        },
        {
            id: 'poisoning_environmental_ck',
            name: 'Poisoning & Environmental Exposure',
            categories: [
                { id: 'environmental_exposure_ck', name: 'Environmental exposure' },
                { id: 'toxicology_ck', name: 'Toxicology' }
            ]
        },
        {
            id: 'pregnancy_ck',
            name: 'Pregnancy, Childbirth & Puerperium',
            categories: [
                { id: 'normal_pregnancy_ck', name: 'Normal pregnancy, childbirth, and puerperium' },
                { id: 'pregnancy_disorders_ck', name: 'Disorders of pregnancy, childbirth, and puerperium' }
            ]
        },
        {
            id: 'psychiatry_behavioral_ck',
            name: 'Psychiatric/Behavioral & Substance Use Disorder',
            categories: [
                { id: 'normal_behavior_ck', name: 'Normal behavior and development' },
                { id: 'anxiety_trauma_ck', name: 'Anxiety and trauma-related disorders' },
                { id: 'mood_disorders_ck', name: 'Mood disorders' },
                { id: 'neurodevelopmental_cognitive_ck', name: 'Neurodevelopmental and neurocognitive disorders' },
                { id: 'personality_impulse_ck', name: 'Personality, impulse control, and sexual disorders' },
                { id: 'psychotic_disorders_ck', name: 'Psychotic disorders' },
                { id: 'substance_use_ck', name: 'Substance use disorders' },
                { id: 'eating_disorders_ck', name: 'Eating disorders' },
                { id: 'somatoform_sleep_ck', name: 'Somatoform disorders and sleep disorders' },
                { id: 'psych_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'pulmonary_ck',
            name: 'Pulmonary & Critical Care',
            categories: [
                { id: 'normal_pulm_ck', name: 'Normal pulmonary structure and function' },
                { id: 'congenital_pulm_ck', name: 'Congenital and developmental anomalies' },
                { id: 'critical_trauma_ck', name: 'Critical care and trauma medicine' },
                { id: 'interstitial_pulm_ck', name: 'Interstitial pulmonary and other systemic disorders' },
                { id: 'lung_cancer_masses_ck', name: 'Cancer and pulmonary/mediastinal masses' },
                { id: 'obstructive_restrictive_ck', name: 'Obstructive and restrictive lung disease' },
                { id: 'pulm_infections_ck', name: 'Pulmonary infections' },
                { id: 'pulm_cardiopulm_ck', name: 'Pulmonary vascular and cardiopulmonary disease' },
                { id: 'sleep_pulm_ck', name: 'Sleep disorders' },
                { id: 'pulm_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'renal_ck',
            name: 'Renal, Urinary Systems & Electrolytes',
            categories: [
                { id: 'normal_renal_ck', name: 'Normal structure and function of the kidneys and urinary system' },
                { id: 'congenital_renal_ck', name: 'Congenital and developmental anomalies' },
                { id: 'aki_ck', name: 'Acute kidney injury' },
                { id: 'ckd_ck', name: 'Chronic kidney disease' },
                { id: 'cystic_kidney_ck', name: 'Cystic kidney diseases' },
                { id: 'electrolytes_ck', name: 'Fluid, electrolytes, and acid-base' },
                { id: 'glomerular_nephrotic_ck', name: 'Glomerular diseases, nephrotic/nephritic syndrome' },
                { id: 'renal_neoplasms_trauma_ck', name: 'Neoplasms and trauma of the kidneys and urinary tract' },
                { id: 'nephrolithiasis_hematuria_ck', name: 'Nephrolithiasis, hematuria, and urinary tract obstruction' },
                { id: 'diabetes_insipidus_ck', name: 'Diabetes insipidus' },
                { id: 'urinary_incontinence_gu_ck', name: 'Urinary incontinence/retention, GU infection' }
            ]
        },
        {
            id: 'rheumatology_ck',
            name: 'Rheumatology/Orthopedics & Sports',
            categories: [
                { id: 'congenital_msk_ck', name: 'Congenital and developmental anomalies' },
                { id: 'arthritis_ck', name: 'Arthritis and spondyloarthropathies' },
                { id: 'autoimmune_msk_ck', name: 'Autoimmune disorders and vasculitides' },
                { id: 'bone_joint_soft_tissue_ck', name: 'Bone, joint, and soft tissue injuries and infections' },
                { id: 'bone_tumors_ck', name: 'Bone tumors and tumor-like lesions' },
                { id: 'spinal_peripheral_ck', name: 'Spinal/peripheral nerve disorders and back pain' },
                { id: 'metabolic_bone_ck', name: 'Metabolic bone disorders' },
                { id: 'rheum_misc_ck', name: 'Miscellaneous' }
            ]
        },
        {
            id: 'social_sciences_ck',
            name: 'Social Sciences (Ethics/Legal/Professional)',
            categories: [
                { id: 'communication_ck', name: 'Communication and interpersonal skills' },
                { id: 'healthcare_policy_ck', name: 'Healthcare policy and economics' },
                { id: 'medical_ethics_ck', name: 'Medical ethics and jurisprudence' },
                { id: 'patient_safety_ck', name: 'Patient safety' },
                { id: 'quality_improvement_ck', name: 'System based-practice and quality improvement' },
                { id: 'social_misc_ck', name: 'Miscellaneous' }
            ]
        }
    ],

    // ===== STEP 3 =====
    'step3': [
        {
            id: 'allergy_immunology_s3',
            name: 'Allergy & Immunology',
            categories: [
                { id: 'allergy_general_s3', name: 'General allergic and immunologic conditions' }
            ]
        },
        {
            id: 'biostatistics_s3',
            name: 'Biostatistics & Epidemiology',
            categories: [
                { id: 'biostats_general_s3', name: 'General biostatistics and epidemiology' }
            ]
        },
        {
            id: 'cardiovascular_s3',
            name: 'Cardiovascular System',
            categories: [
                { id: 'cardio_general_s3', name: 'General cardiovascular conditions' }
            ]
        },
        {
            id: 'dermatology_s3',
            name: 'Dermatology',
            categories: [
                { id: 'derm_general_s3', name: 'General dermatologic conditions' }
            ]
        },
        {
            id: 'ent_s3',
            name: 'Ear, Nose & Throat (ENT)',
            categories: [
                { id: 'ent_general_s3', name: 'General ENT conditions' }
            ]
        },
        {
            id: 'endocrine_s3',
            name: 'Endocrine, Diabetes & Metabolism',
            categories: [
                { id: 'endocrine_general_s3', name: 'General endocrine, diabetes, and metabolic conditions' }
            ]
        },
        {
            id: 'female_reproductive_s3',
            name: 'Female Reproductive System & Breast',
            categories: [
                { id: 'female_general_s3', name: 'General female reproductive and breast conditions' }
            ]
        },
        {
            id: 'gi_s3',
            name: 'Gastrointestinal & Nutrition',
            categories: [
                { id: 'gi_general_s3', name: 'General gastrointestinal and nutrition conditions' }
            ]
        },
        {
            id: 'general_principles_s3',
            name: 'General Principles',
            categories: [
                { id: 'general_misc_s3', name: 'Miscellaneous general principles' }
            ]
        },
        {
            id: 'hematology_oncology_s3',
            name: 'Hematology & Oncology',
            categories: [
                { id: 'heme_general_s3', name: 'General hematologic and oncologic conditions' }
            ]
        },
        {
            id: 'infectious_diseases_s3',
            name: 'Infectious Diseases',
            categories: [
                { id: 'infectious_general_s3', name: 'General infectious diseases' }
            ]
        },
        {
            id: 'male_reproductive_s3',
            name: 'Male Reproductive System',
            categories: [
                { id: 'male_general_s3', name: 'General male reproductive conditions' }
            ]
        },
        {
            id: 'multisystem_s3',
            name: 'Miscellaneous (Multisystem)',
            categories: [
                { id: 'multisystem_general_s3', name: 'General multisystem conditions' }
            ]
        },
        {
            id: 'nervous_s3',
            name: 'Nervous System',
            categories: [
                { id: 'neuro_general_s3', name: 'General neurologic conditions' }
            ]
        },
        {
            id: 'ophthalmology_s3',
            name: 'Ophthalmology',
            categories: [
                { id: 'ophthalmo_general_s3', name: 'General ophthalmologic conditions' }
            ]
        },
        {
            id: 'poisoning_environmental_s3',
            name: 'Poisoning & Environmental Exposure',
            categories: [
                { id: 'poisoning_general_s3', name: 'General poisoning and environmental exposures' }
            ]
        },
        {
            id: 'pregnancy_s3',
            name: 'Pregnancy, Childbirth & Puerperium',
            categories: [
                { id: 'pregnancy_general_s3', name: 'General pregnancy and childbirth conditions' }
            ]
        },
        {
            id: 'psychiatry_behavioral_s3',
            name: 'Psychiatric/Behavioral & Substance Use Disorder',
            categories: [
                { id: 'psych_general_s3', name: 'General psychiatric and behavioral conditions' }
            ]
        },
        {
            id: 'pulmonary_s3',
            name: 'Pulmonary & Critical Care',
            categories: [
                { id: 'pulm_general_s3', name: 'General pulmonary and critical care conditions' }
            ]
        },
        {
            id: 'renal_s3',
            name: 'Renal, Urinary Systems & Electrolytes',
            categories: [
                { id: 'renal_general_s3', name: 'General renal and urinary conditions' }
            ]
        },
        {
            id: 'rheumatology_s3',
            name: 'Rheumatology/Orthopedics & Sports',
            categories: [
                { id: 'rheum_general_s3', name: 'General rheumatologic and orthopedic conditions' }
            ]
        },
        {
            id: 'social_sciences_s3',
            name: 'Social Sciences (Ethics/Legal/Professional)',
            categories: [
                { id: 'social_general_s3', name: 'General social science topics' }
            ]
        }
    ],

    // ===== OET =====
    'oet': [
        {
            id: 'listening',
            name: '👂 Listening',
            categories: [
                { id: 'consultation_listening', name: 'Consultation Extracts' },
                { id: 'presentation_listening', name: 'Healthcare Presentations' },
                { id: 'workplace_listening', name: 'Workplace Scenarios' }
            ]
        },
        {
            id: 'reading',
            name: '📖 Reading',
            categories: [
                { id: 'expeditious_reading', name: 'Expeditious Reading (Skimming & Scanning)' },
                { id: 'careful_reading', name: 'Careful Reading (Detailed Comprehension)' },
                { id: 'medical_texts', name: 'Medical Texts and Research' }
            ]
        },
        {
            id: 'writing',
            name: '✍️ Writing',
            categories: [
                { id: 'referral_letters', name: 'Referral Letters' },
                { id: 'discharge_summaries', name: 'Discharge Summaries' },
                { id: 'transfer_letters', name: 'Transfer Letters' },
                { id: 'medical_correspondence', name: 'Medical Correspondence' }
            ]
        },
        {
            id: 'speaking',
            name: '🗣️ Speaking',
            categories: [
                { id: 'roleplay_patients', name: 'Role-play: Patient Consultations' },
                { id: 'roleplay_colleagues', name: 'Role-play: Colleague Interactions' },
                { id: 'roleplay_families', name: 'Role-play: Family Discussions' },
                { id: 'clinical_communication', name: 'Clinical Communication Skills' }
            ]
        }
    ]
};
