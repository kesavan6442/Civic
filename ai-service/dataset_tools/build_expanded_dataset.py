# CivicConnect 7,200 Sample Dataset Generator
import json
import os
import random

DISTRICTS = [
    'Ranchi', 'Dhanbad', 'East Singhbhum (Jamshedpur)', 'Bokaro', 'Deoghar',
    'Hazaribagh', 'Giridih', 'Ramgarh', 'Palamu', 'Dumka', 'West Singhbhum (Chaibasa)',
    'Sahibganj', 'Latehar', 'Simdega', 'Khunti', 'Jamtara', 'Pakur', 'Godda',
    'Garhwa', 'Koderma', 'Gumla', 'Lohardaga', 'Saraikela Kharsawan', 'Chatra'
]

POPULATIONS_EN = ['50 households', '200 families', '500 residents', '1,200 villagers', 'school students', 'entire ward', 'market vendors', 'commuters', 'over 3,000 residents', 'patients and staff', 'farmers cluster', 'daily wage workers']
POPULATIONS_HI = ['50 परिवार', '200 घर', '500 निवासी', '1,200 ग्रामीण', 'स्कूली बच्चे', 'पूरा वार्ड', 'दुकानदार', 'राहगीर', '3,000 से अधिक लोग', 'मरीज व स्टाफ', 'किसान समूह', 'दहाड़ी मजदूर']

DURATIONS_EN = ['past 24 hours', '3 days', '1 week', '2 weeks', '1 month', 'past 3 months', 'since last Friday', 'ongoing for 6 months', 'since the monsoon', 'over a year']
DURATIONS_HI = ['पिछले 24 घंटे', '3 दिन', '1 सप्ताह', '2 सप्ताह', '1 महीना', 'पिछले 3 महीने', 'पिछले शुक्रवार', '6 महीने से', 'बरसात के बाद से', 'एक साल से अधिक']

EVIDENCE_EN = ['Photo evidence and GPS coordinates attached.', 'On-site video evidence available.', 'Field inspection photos submitted.', 'Photographic proof uploaded by residents.', 'Supporting geotagged images attached.']
EVIDENCE_HI = ['मौके की तस्वीर और जीपीएस लोकेशन संलग्न है।', 'घटनास्थल का वीडियो साक्ष्य उपलब्ध है।', 'निरीक्षण की फोटो संलग्न की गई है।', 'नागरिकों द्वारा जियोटैग्ड फोटो अपलोड की गई है।', 'प्रमाण स्वरूप तस्वीरें संलग्न हैं।']

PREFIXES_EN = ['Formal Complaint:', 'Urgent Citizen Report:', 'Municipal Petition:', 'Ward Grievance:', 'Emergency Alert:', 'Community Escalation:', 'Field Notice:', 'Public Safety Alert:', 'Civic Action Request:', 'Resident Memorandum:']
PREFIXES_HI = ['औपचारिक शिकायत:', 'आपातकालीन नागरिक रिपोर्ट:', 'नगर निगम ज्ञापन:', 'वार्ड स्तर की शिकायत:', 'आपात सूचना:', 'सामुदायिक अपील:', 'क्षेत्रीय सूचना:', 'जन सुरक्षा अलर्ट:', 'नागरिक समाधान मांग:', 'ग्रामीणों का ज्ञापन:']

VARIATION_TEMPLATES_EN = [
    '{prefix} In {district}, {issue} This has been ongoing for {dur} and affects {pop}. {evidence_stmt}',
    '{prefix} Urgent report from {district}: {issue} Over {pop} have been struggling for {dur}. {evidence_stmt}',
    'Public Grievance Alert ({district}): {issue} The situation has persisted for {dur}. Estimated {pop} impacted. {evidence_stmt}',
    'Field Inspection Note [{district}]: {issue} Duration: {dur}. Community impact: {pop}. {evidence_stmt}',
    '{issue} Location: {district}. Duration: {dur}. Affected: {pop}. {evidence_stmt}'
]

VARIATION_TEMPLATES_HI = [
    '{prefix} {district} में {issue} यह समस्या पिछले {dur} से बनी हुई है और लगभग {pop} प्रभावित हैं। {evidence_stmt}',
    '{prefix} {district} से नागरिक शिकायत: {issue} {dur} से {pop} भारी परेशानी झेल रहे हैं। {evidence_stmt}',
    'सार्वजनिक शिकायत ({district}): {issue} स्थिति {dur} से गंभीर है। {pop} परेशान हैं। {evidence_stmt}',
    'क्षेत्रीय निरीक्षण रिपोर्ट [{district}]: {issue} अवधि: {dur}। प्रभावित संख्या: {pop}। {evidence_stmt}',
    '{issue} स्थान: {district}। अवधि: {dur}। प्रभावित: {pop}। {evidence_stmt}'
]
