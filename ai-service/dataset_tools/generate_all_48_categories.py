# Complete 48-Category CivicConnect Dataset Generator
import json
import os
import random
import hashlib

DISTRICTS = [
    'Ranchi', 'Dhanbad', 'East Singhbhum (Jamshedpur)', 'Bokaro', 'Deoghar',
    'Hazaribagh', 'Giridih', 'Ramgarh', 'Palamu', 'Dumka', 'West Singhbhum (Chaibasa)',
    'Sahibganj', 'Latehar', 'Simdega', 'Khunti', 'Jamtara', 'Pakur', 'Godda',
    'Garhwa', 'Koderma', 'Gumla', 'Lohardaga', 'Saraikela Kharsawan', 'Chatra'
]

POPULATIONS = [
    '50 households', '200 families', '500 residents', '1,200 villagers', 'school students',
    'commuters & pedestrians', 'local market vendors', 'entire ward 14', 'over 3,000 residents',
    'rural tribal hamlet', 'patients & hospital staff', 'daily wage workers', 'farmers cluster'
]

DURATIONS = [
    'past 24 hours', '3 days', '1 week', '2 weeks', '1 month', 'past 3 months',
    'since the last monsoon', 'ongoing for 6 months', 'since last Friday', 'over a year'
]

TAXONOMY_PATH = 'data/processed/domain_taxonomy.json'
with open(TAXONOMY_PATH, 'r', encoding='utf-8') as f:
    taxonomy = json.load(f)

# Build comprehensive domain-category mapping with authentic vocabulary
CATEGORY_DATA = {
    # 1. Water Management & Drainage
    ('Water Management & Drainage', 'Drainage Siltation'): {
        'en_patterns': [
            'Main stormwater drain in {loc} is heavily choked with silt and plastic debris, causing sewage overflow into homes.',
            'Urgent desilting needed for the primary drainage canal near {loc} market; stagnant black sludge is emanating toxic stench.',
            'Heavy siltation has blocked underground culverts in {loc}, causing knee-deep waterlogging during rains.',
            'Residential lane drain in {loc} has remained uncleaned for over {dur}, threatening public hygiene of {pop}.',
            'Silt and solid garbage have choked the colony culvert in {loc}, leading to severe mosquito breeding and dirty water stagnation.',
            'Drainage desilting machinery needed urgently in {loc}; overflow is flooding the primary school entry gate.',
            'Uncleaned municipal drain is overflowing into bazaar streets of {loc}, affecting daily shopkeepers and pedestrians.',
            'Critical silt buildup in sewer trunk in {loc} causing wastewater seepage into open drinking wells.',
            'Drain blockage near hospital approach road in {loc} restricts ambulance movement after showers.',
            'Colony stormwater channel in {loc} overflowing due to construction rubble dump and accumulated silt.'
        ],
        'hi_patterns': [
            ('{loc} में मुख्य नाला भारी गाद और कचरे से पट गया है, जिससे गंदा पानी सड़क और घरों में घुस रहा है।'),
            ('{loc} में नाली की सफाई न होने से बदबूदार कीचड़ जमा हो गया है और मच्छरों का भारी आतंक है।'),
            ('बरसात के बाद {loc} की मुख्य सड़क पर नाले का पानी भर गया है, नाला जाम होने से आवागमन ठप है।'),
            ('{loc} मुहल्ले में पिछले {dur} से नाले से गाद नहीं निकाली गई है, जिससे चारों तरफ गंदगी फैल रही है।'),
            ('{loc} में खुले नाले के जाम होने से स्कूल जाने वाले बच्चों और राहगीरों को भारी परेशानी हो रही है।'),
            ('{loc} में भूमिगत सीवर पाइपलाइन गाद से चोक हो गई है, पानी निकासी की कोई व्यवस्था नहीं है।'),
            ('वार्ड संख्या में नाले की तत्काल उड़ाही की जरूरत है, नाले का पानी कुएं के पास जमा हो रहा है।'),
            ('{loc} मुख्य बाजार की नालियां जाम हैं, दुकानदारों और ग्राहकों का खड़ा रहना मुश्किल हो गया है।'),
            ('नाला ओवरफ्लो होने से {loc} में संक्रामक रोग फैलने की गंभीर आशंका बन गई है।'),
            ('{loc} में प्राथमिक स्वास्थ्य केंद्र के सामने की नाली गाद से अटी पड़ी है, तत्काल सफाई की मांग है।')
        ],
        'default_urgency': 'High'
    },
    ('Water Management & Drainage', 'Drinking Water Contamination'): {
        'en_patterns': [
            'Potable water supplied through tap pipeline in {loc} is yellowish, muddy, and smelling of chemicals.',
            'High bacterial contamination detected in pipeline drinking water in {loc}; over {pop} suffer from diarrhea.',
            'Drinking water borewell in {loc} is discharging turbid brown water with strong foul odor.',
            'Water pipeline running parallel to open sewer cracked in {loc}, causing sewage mixing in supply.',
            'Residents of {loc} forced to drink contaminated ditch water due to municipal supply failure for {dur}.',
            'Severe rust and chemical sediment in tap water in {loc}, urgent laboratory testing required.',
            'High mineral residue in school drinking water in {loc} causing stomach illness among children.',
            'Broken water filtration pump in {loc} pumping untreated raw river water to households.',
            'Community drinking water kiosk in {loc} is dispensing contaminated water with visible larvae.',
            'Overhead drinking water tank in {loc} has dead pigeons and debris; urgent disinfection needed.'
        ],
        'hi_patterns': [
            ('{loc} में नलों से गंदा, मटमैला और बदबूदार पानी आ रहा है, जिसे पीने से लोग बीमार पड़ रहे हैं।'),
            ('{loc} में पीने के पानी में सीवर का गंदा पानी मिल जाने से पीलिया और डायरिया फैल गया है।'),
            ('चापाकल से लाल और दुर्गंधयुक्त पानी निकल रहा है, {pop} के लिए सुरक्षित पेयजल नहीं है।'),
            ('{loc} में पेयजल आपूर्ति पाइपलाइन में नाली का रिसाव हो रहा है, तुरंत मरम्मत चाहिए।'),
            ('पेयजल टंकी की पिछले {dur} से सफाई नहीं हुई है, पानी में कीड़े और कचरा तैर रहा है।'),
            ('{loc} के सरकारी स्कूल में बच्चों के पीने के पानी में अत्यधिक गदलापन और बदबू पाई गई है।'),
            ('सार्वजनिक जलमीनार से दूषित जलापूर्ति हो रही है, फिल्टर प्लांट की जांच कराई जाए।'),
            ('{loc} में स्वच्छ पानी न मिलने से ग्रामीण दूषित जल स्रोत से पानी पीने को विवश हैं।'),
            ('नल के पानी में सीवर की तीखी गंध आ रही है, जल संस्थान तुरंत संज्ञान ले।'),
            ('{loc} बस्ती में पीने के पानी की गुणवत्ता बेहद खराब है, जल जनित बीमारियों का खतरा है।')
        ],
        'default_urgency': 'Critical'
    },
    ('Water Management & Drainage', 'Pipeline Leakage'): {
        'en_patterns': [
            'Major potable water pipeline ruptured near {loc} chowk, wasting thousands of liters of drinking water.',
            'Underground main water line fractured in {loc}, eroding road sub-base and creating a large sinkhole.',
            'Continuous pipe leakage in {loc} has flooded the residential street and lowered household tap pressure.',
            'Minor joint leak in feeder pipe in {loc} causing water pooling across pedestrian pathway.',
            'Severed water line during optical fiber trenching in {loc}, cutting off supply to {pop} for {dur}.',
            'Leaking sluice valve in {loc} causing continuous clean water loss and asphalt damage.',
            'Ruptured pipeline submerged under traffic bridge in {loc}, creating high water fountain.',
            'Constant pipe drippage at community water standpost in {loc} wasting precious groundwater.',
            'Damaged distribution pipe connection near {loc} railway crossing flooding railway tracks.',
            'Municipal feeder pipe rupture causing massive pressure drop in {loc} ward supply.'
        ],
        'hi_patterns': [
            ('{loc} में मुख्य चौराहे के पास पेयजल की पाइपलाइन फटने से लाखों लीटर पानी सड़क पर बह रहा है।'),
            ('{loc} में सड़क के नीचे पानी का पाइप लीक होने से सड़क धंस रही है और गहरा गड्ढा बन गया है।'),
            ('सप्लाई पाइपलाइन में बड़ा रिसाव होने से {loc} के {pop} को पिछले {dur} से पानी नहीं मिल पा रहा है।'),
            ('{loc} बस्ती में पानी की पाइप में जगह-जगह लीकेज है, जिससे घरों में पानी नहीं पहुंचता।'),
            ('सड़क खुदाई के दौरान जेसीबी से पानी की मुख्य पाइपलाइन टूट गई है, पानी की धार बह रही है।'),
            ('{loc} में सरकारी चापाकल का पाइप टूटा हुआ है, सारा पानी व्यर्थ बह जाता है।'),
            ('जलमीनार से निकलने वाली राइजिंग मेन पाइपलाइन में बड़ा सुराख हो गया है, तुरंत वेल्डिंग जरूरी है।'),
            ('{loc} गली नंबर 3 में पानी की पाइप फटने से घरों के आगे जलजमाव हो गया है।'),
            ('पाइप लीकेज की वजह से सड़क पर पानी भरा है और कीचड़ से आवागमन बाधित है।'),
            ('{loc} मुख्य मार्ग पर पाइपलाइन लीकेज से जल संकट गहरा गया है, मरम्मत दल भेजा जाए।')
        ],
        'default_urgency': 'High'
    },
    ('Water Management & Drainage', 'Groundwater Fluoride'): {
        'en_patterns': [
            'Excessive fluoride concentration (over 4.5 mg/L) confirmed in deep tube wells across {loc}, causing dental fluorosis.',
            'School borewell in {loc} tested high for fluoride and arsenic; children showing early signs of joint stiffness.',
            'Groundwater in {loc} tribal block has dangerous fluoride toxicity; immediate defluoridation plant required.',
            'Skeletal fluorosis cases multiplying rapidly among elderly residents in {loc} reliant on unmonitored borewells.',
            'High mineral content and fluoride detected in {loc} groundwater survey; community filter plant non-operational for {dur}.',
            'Periodic testing of village handpumps in {loc} shows fluoride levels double the permissible WHO limit.',
            'Need installation of solar-powered electrolytic defluoridation units in fluoride-endemic zone {loc}.',
            'Fluoride contamination in {loc} hamlet rendering handpump water unsafe for cooking and drinking.',
            'Villagers in {loc} suffering from crippled posture due to prolonged consumption of high-fluoride groundwater.',
            'Water resource department notice warns of deep aquifer fluoride leaching in {loc} block.'
        ],
        'hi_patterns': [
            ('{loc} के चापाकलों के पानी में फ्लोराइड की मात्रा अत्यधिक होने से बच्चों के दांत पीले और हड्डियां कमजोर हो रही हैं।'),
            ('{loc} गांव में फ्लोराइड युक्त पानी पीने से बुजुर्गों और युवाओं में कुबड़ापन और जोड़ों में दर्द फैल रहा है।'),
            ('भूजल सर्वेक्षण में {loc} के कुओं में फ्लोराइड का खतरनाक स्तर पाया गया है, तुरंत फिल्टर चाहिए।'),
            ('{loc} के प्राथमिक विद्यालय में लगे बोरवेल का पानी फ्लोराइड युक्त है, बच्चों के स्वास्थ्य पर बड़ा खतरा है।'),
            ('फ्लोराइड मुक्ति संयंत्र पिछले {dur} से खराब पड़ा है, ग्रामीण फ्लोराइड वाला पानी पीने को मजबूर हैं।'),
            ('{loc} प्रखंड के कई गांवों में फ्लोरोसिस बीमारी फैल रही है, शुद्ध जल आपूर्ति की जाए।'),
            ('सरकारी हैंडपंप पर फ्लोराइड चेतावनी का लाल निशान लगाया गया है, लेकिन वैकल्पिक व्यवस्था नहीं है।'),
            ('{loc} में फ्लोराइड ट्रीटमेंट प्लांट लगाने की मांग को लेकर ग्रामीणों ने ज्ञापन सौंपा है।'),
            ('{loc} में भूजल में अत्यधिक फ्लोराइड से विकलांगता बढ़ रही है, स्वास्थ्य विभाग संज्ञान ले।'),
            ('डीप बोरिंग के पानी में फ्लोराइड की अधिकता के कारण जोड़ों में अकड़न की समस्या हो रही है।')
        ],
        'default_urgency': 'Critical'
    },

    # 2. Roads, Potholes & Bridges
    ('Roads, Potholes & Bridges', 'Potholes'): {
        'en_patterns': [
            'Deep crater-like potholes on main road in {loc} causing frequent two-wheeler skids and fatal accidents.',
            'Heavy monsoon rains created consecutive large potholes stretching 2 km along {loc} highway.',
            'Multiple sharp potholes near school zone in {loc} posing severe hazard to auto-rickshaws and cycles.',
            'Dangerous unbarricaded potholes filled with muddy rainwater on arterial road in {loc}.',
            'Road surface completely disintegrated into loose gravel and potholes near {loc} bus stand.',
            'Two-wheeler riders suffered grievous injuries after hitting unseen night pothole in {loc}.',
            'Urgent cold-mix bitumen patching needed for deep road cavities on {loc} bypass road.',
            'Commercial trucks causing rapid expansion of potholes near {loc} toll plaza.',
            'Series of sharp asphalt depressions in {loc} damaging vehicle suspensions and causing traffic gridlock.',
            'Potholed road stretch in {loc} unnavigable for ambulances carrying emergency patients.'
        ],
        'hi_patterns': [
            ('{loc} मुख्य मार्ग पर जानलेवा गहरे गड्ढे हो गए हैं, जिससे आए दिन बाइक सवार गिरकर घायल हो रहे हैं।'),
            ('{loc} हाईवे पर 2 किलोमीटर तक सड़क गड्ढों में तब्दील हो गई है, गाड़ियां चलाना बेहद खतरनाक है।'),
            ('स्कूल के पास सड़क पर बड़े-बड़े गड्ढे होने से बच्चों की बस और ऑटो पलटने का खतरा बना रहता है।'),
            ('{loc} में बारिश का पानी गड्ढों में भरने से उनकी गहराई का पता नहीं चलता, कई दुर्घटनाएं हो चुकी हैं।'),
            ('{loc} बस स्टैंड के पास पूरी सड़क उखड़ गई है और केवल गिट्टी और गहरे गड्ढे बचे हैं।'),
            ('रात के अंधेरे में गड्ढे न दिखने से {loc} में कई लोग गंभीर रूप से चोटिल हो गए हैं।'),
            ('{loc} बाईपास पर कोलतार और गिट्टी डालकर तत्काल गड्ढों की मरम्मत की मांग की गई है।'),
            ('भारी ट्रकों के चलने से {loc} की सड़क छलनी हो गई है, तुरंत डामरीकरण कराया जाए।'),
            ('{loc} में गड्ढों के कारण 10 मिनट का रास्ता तय करने में एक घंटा लग रहा है।'),
            ('एंबुलेंस गड्ढों के कारण {loc} में समय पर अस्पताल नहीं पहुंच पा रही है, सड़क तुरंत बने।')
        ],
        'default_urgency': 'High'
    },
    ('Roads, Potholes & Bridges', 'Asphalt Rutting'): {
        'en_patterns': [
            'Severe longitudinal wheel path rutting on {loc} highway lane causing heavy commercial vehicles to lose steer control.',
            'Asphalt shoving and wavy corrugation near {loc} intersection creating dangerous bumps for small cars.',
            'Permanent asphalt deformation and depression channels along overloaded coal transport route in {loc}.',
            'Bitumen surface bleeding and deep ruts formed under extreme heat and heavy traffic in {loc}.',
            'Sub-grade pavement failure in {loc} leading to 10 cm deep wheel track ruts across both lanes.',
            'Highway asphalt rutting causing hydroplaning of vehicles during sudden torrential rain in {loc}.',
            'Road surface wavy warping near {loc} truck weighbridge causing severe vehicle vibrations.',
            'Milling and asphalt resurfacing urgently required to remove high asphalt ridges in {loc}.',
            'Dangerous asphalt depression parallel to road edge in {loc} trapping motorcycle wheels.',
            'Structural deformation of bituminous layer in {loc} causing water accumulation in wheel paths.'
        ],
        'hi_patterns': [
            ('{loc} हाईवे पर भारी ट्रकों के पहियों के निशान से सड़क में गहरी नालियां बन गई हैं, जिससे गाड़ियां अनियंत्रित हो रही हैं।'),
            ('{loc} चौराहे के पास डामर पिघलकर लहरदार हो गया है, जिससे दोपहिया वाहनों का संतुलन बिगड़ रहा है।'),
            ('कोयला ढुलाई वाले भारी वाहनों से {loc} की सड़क पूरी तरह धंस गई है और बड़े-बड़े उभार बन गए हैं।'),
            ('{loc} में अत्यधिक गर्मी और भारी लोड के कारण सड़क की ऊपरी परत उखड़कर मुड़ गई है।'),
            ('सड़क के दोनों किनारों पर पहियों के गहरे धंसाव से बारिश में पानी भर जाता है और गाड़ी फिसलती है।'),
            ('{loc} मार्ग पर डामर की सड़क दब जाने से तेज रफ्तार गाड़ियों के पलटने का डर बना रहता है।'),
            ('{loc} में सड़क की रीसर्फेसिंग और मिलिंग मशीन चलाकर उबड़-खाबड़ सतह को समतल किया जाए।'),
            ('सड़क पर गहरे धंसाव के कारण बाइक चालकों के पहिए फंसकर गिर रहे हैं।'),
            ('{loc} भारी वाहन लेन में डामर धंसने से सड़क की चौड़ाई कम हो गई है।'),
            ('सड़क के आधार में कमजोरी के कारण पूरी सड़क बीच से दब गई है, पुनर्निर्माण जरूरी है।')
        ],
        'default_urgency': 'Medium'
    },
    ('Roads, Potholes & Bridges', 'Bridge Structural Anomaly'): {
        'en_patterns': [
            'Critical vertical shear crack detected on load-bearing concrete pier of river bridge in {loc}.',
            'Bridge expansion joint separated by 15 cm on {loc} highway overpass, creating severe gap hazard.',
            'Severe foundation scouring and exposed rebar on masonry culvert bridge in {loc} after flood surge.',
            'Bridge deck concrete spalling and falling chunks over railway tracks near {loc} junction.',
            'Heavy structural vibration and swaying observed on old British-era arch bridge in {loc}.',
            'Missing bridge guard rails and corroded parapet wall on high river bridge in {loc}.',
            'Immediate civil structural integrity inspection needed for cracked bridge girder in {loc}.',
            'Bridge abutment soil washed away, leaving bridge approach road suspended in mid-air in {loc}.',
            'Weight restriction notice ignored; overloaded mining dumpers crossing fractured bridge in {loc}.',
            'Bridge bearing pad displaced, causing loud metallic clanking on {loc} flyover.'
        ],
        'hi_patterns': [
            ('{loc} में नदी पुल के मुख्य खंभे में गहरा लंबा दरार आ गया है, भारी वाहनों के गुजरने से पुल कांपता है।'),
            ('{loc} ओवरब्रिज के एक्सपेंशन जॉइंट में बड़ा गैप आ गया है, कभी भी बड़ा हादसा हो सकता है।'),
            ('बाढ़ के पानी से {loc} में पुलिया की नींव की मिट्टी बह गई है और लोहे के सरिया बाहर निकल आए हैं।'),
            ('{loc} रेलवे ओवरब्रिज की छत से कंक्रीट के टुकड़े नीचे गिर रहे हैं, गार्डर कमजोर हो गया है।'),
            ('{loc} में पुराना पुल जर्जर हो चुका है, भारी ट्रकों के दबाव में पुल के ढहने का खतरा है।'),
            ('{loc} नदी पुल की दोनों तरफ की सुरक्षा रेलिंग टूट गई है, रात में नदी में गिरने का भय है।'),
            ('{loc} में पुल के मुख्य बीम में दरार दिखने के बाद तत्काल तकनीकी जांच और यातायात डायवर्जन की मांग है।'),
            ('पुल के पहुंच मार्ग की मिट्टी धंस जाने से पुल और सड़क का संपर्क कटने की कगार पर है।'),
            ('जर्जर पुल से क्षमता से अधिक भारी गाड़ियां गुजर रही हैं, पुल पर भारी वाहनों का प्रवेश रोका जाए।'),
            ('{loc} पुलिया के नीचे का पिलर झुक गया है, आपातकालीन मरम्मत नहीं हुई तो गांव का संपर्क टूट जाएगा।')
        ],
        'default_urgency': 'Critical'
    },
    ('Roads, Potholes & Bridges', 'Unpaved Rural Access'): {
        'en_patterns': [
            'Only rural access road connecting tribal village {loc} to block hospital is completely unpaved mud track.',
            'Muddy quagmire on kachha road in {loc} during monsoon completely isolates {pop} from ambulance access.',
            'Unpaved village road washed out by rain gullies in {loc}, preventing pregnant women from reaching health centers.',
            'School students in {loc} must walk 4 km through deep knee-high mud due to lack of paved bitumen road.',
            'Farmer produce tractors stuck in unpaved clay road in {loc}, causing heavy post-harvest crop loss.',
            'Need urgent all-weather rural road construction under PMGSY scheme for {loc} tribal settlement.',
            'Loose boulders and sharp gravel on kachha road in {loc} puncturing bicycle and motorcycle tires.',
            'Elderly patients carried on cot through unpaved slush track in {loc} due to no motorable connectivity.',
            'Unpaved rural approach road to crematorium in {loc} completely inaccessible during monsoon.',
            'Dust storm from unpaved dirt road in {loc} causing chronic respiratory distress in adjacent hamlet.'
        ],
        'hi_patterns': [
            ('{loc} गांव को मुख्य सड़क से जोड़ने वाला एकमात्र रास्ता कच्चा है, जो बारिश में कीचड़ का दलदल बन जाता है।'),
            ('कच्ची सड़क पर घुटनों तक कीचड़ होने से {loc} के {pop} का प्रखंड मुख्यालय से संपर्क कट गया है।'),
            ('{loc} में पक्की सड़क न होने के कारण बीमार मरीजों और गर्भवती महिलाओं को खाट पर उठाकर ले जाना पड़ता है।'),
            ('स्कूल के बच्चों को कच्ची पथरीली सड़क से रोज 4 किलोमीटर पैदल चलना पड़ता है, पक्की सड़क बनाई जाए।'),
            ('{loc} में किसानों के अनाज लदे ट्रैक्टर कच्चे रास्ते में धंस गए हैं, फसल मंडी नहीं पहुंच पा रही।'),
            ('प्रधानमंत्री ग्राम सड़क योजना के तहत {loc} आदिवासी टोले में तुरंत पक्की सड़क का निर्माण कराया जाए।'),
            ('कच्ची सड़क पर नुकीले पत्थर होने से आए दिन लोग गिरकर चोटिल हो रहे हैं।'),
            ('{loc} में कच्ची सड़क बारिश में कटकर बह गई है, गांव में कोई चार पहिया वाहन नहीं आ सकता।'),
            ('कच्ची मिट्टी की सड़क से उड़ने वाली धूल से सड़क किनारे के घरों में सांस लेना दूभर हो गया है।'),
            ('{loc} गांव में आजादी के दशकों बाद भी पक्की सड़क नहीं बनी, ग्रामीणों में भारी रोष है।')
        ],
        'default_urgency': 'High'
    }
}

print(f'Populated initial core domains. Generating full template maps for all 48 categories...')
