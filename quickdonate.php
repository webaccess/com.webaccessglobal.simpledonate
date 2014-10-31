<?php

require_once 'quickdonate.civix.php';

/**
 * Implementation of hook_civicrm_config
 */
function quickdonate_civicrm_config(&$config) {
  _quickdonate_civix_civicrm_config($config);
}

/**
 * Implementation of hook_civicrm_xmlMenu
 *
 * @param $files array(string)
 */
function quickdonate_civicrm_xmlMenu(&$files) {
  _quickdonate_civix_civicrm_xmlMenu($files);
}

/**
 * Implementation of hook_civicrm_install
 */
function quickdonate_civicrm_install() {
  $civiContributeParentId = CRM_Core_DAO::getFieldValue('CRM_Core_DAO_Navigation', 'CiviContribute', 'id', 'name');
  $params = array(
    'domain_id' => CRM_Core_Config::domainID(),
    'label'     => 'Quick Donation Configuration',
    'name'      => 'Quick Donation Configuration',
    'url'       => 'civicrm/quick/donation/configuration',
    'permission'=> 'access CiviContribute',
    'parent_id' => $civiContributeParentId,
    'has_separator' => 1,
    'is_active' => 1,
  );
  CRM_Core_BAO_Navigation::add($params);

  $contributionsParentId = CRM_Core_DAO::getFieldValue('CRM_Core_DAO_Navigation', 'Contributions', 'id', 'name');
  $donationNavigation = new CRM_Core_DAO_Navigation();
  $params = array(
    'domain_id' => CRM_Core_Config::domainID(),
    'label'     => 'Quick Donation',
    'name'      => 'Quick Donation',
    'url'       => NULL,
    'permission'=> 'access CiviContribute',
    'parent_id' => $contributionsParentId,
    'has_separator' => 1,
    'is_active' => 1,
    'weight' => 100,
  );
  $donationNavigation->copyValues($params);
  $donationNavigation->save();

  $donationMenuTree = array(
    array(
      'label' => ts('Test Donation'),
      'name' => 'Test Donation',
      'url'  => 'civicrm/quick?test=1#/donation',
      'permission' => 'access CiviContribute',
    ),
    array(
      'label' => ts('Live Donation'),
      'name' => 'Live Donation',
      'url'  => 'civicrm/quick/#/donation',
      'permission' => 'access CiviContribute',
    ),
  );

  foreach ($donationMenuTree as $key => $menuItems) {
    $menuItems['is_active'] = 1;
    $menuItems['parent_id'] =  $donationNavigation->id;
    $menuItems['weight'] = $key;
    CRM_Core_BAO_Navigation::add($menuItems);
  }
  CRM_Core_BAO_Navigation::resetNavigation();
  return _quickdonate_civix_civicrm_install();
}

/**
 * Implementation of hook_civicrm_uninstall
 */
function quickdonate_civicrm_uninstall() {
  $query = "DELETE FROM civicrm_navigation WHERE name in ('Quick Donation','Quick Donation Configuration')";
  CRM_Core_DAO::executeQuery($query);
  CRM_Core_BAO_Navigation::resetNavigation();
  return _quickdonate_civix_civicrm_uninstall();
}

/**
 * Implementation of hook_civicrm_enable
 */
function quickdonate_civicrm_enable() {
  $sql = "UPDATE civicrm_navigation SET is_active=1 WHERE name IN ('Quick Donation Configuration', 'Quick Donation', 'Test Donation', 'Live Donation')";
  CRM_Core_DAO::executeQuery($sql);
  return _quickdonate_civix_civicrm_enable();
}

/**
 * Implementation of hook_civicrm_disable
 */
function quickdonate_civicrm_disable() {
  $sql = "UPDATE civicrm_navigation SET is_active=0 WHERE name IN ('Quick Donation Configuration', 'Quick Donation', 'Test Donation', 'Live Donation')";
  CRM_Core_DAO::executeQuery($sql);
  return _quickdonate_civix_civicrm_disable();
}

/**
 * Implementation of hook_civicrm_upgrade
 *
 * @param $op string, the type of operation being performed; 'check' or 'enqueue'
 * @param $queue CRM_Queue_Queue, (for 'enqueue') the modifiable list of pending up upgrade tasks
 *
 * @return mixed  based on op. for 'check', returns array(boolean) (TRUE if upgrades are pending)
 *                for 'enqueue', returns void
 */
function quickdonate_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _quickdonate_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implementation of hook_civicrm_managed
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 */
function quickdonate_civicrm_managed(&$entities) {
  return _quickdonate_civix_civicrm_managed($entities);
}

/**
 * Implementation of hook_civicrm_caseTypes
 *
 * Generate a list of case-types
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 */
function quickdonate_civicrm_caseTypes(&$caseTypes) {
  _quickdonate_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implementation of hook_civicrm_alterSettingsFolders
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function quickdonate_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _quickdonate_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

function quickdonate_civicrm_pageRun(&$page) {
  $pageName = $page->getVar('_name');
  if ($pageName == 'CRM_Core_Page_Angular') {
    quickdonate_getQuickDonateSetting();
  }
}

/**
 * get tab options from DB using setting-get api
 */
function quickdonate_getQuickDonateSetting() {
  $domainID = CRM_Core_Config::domainID();
  $settings = civicrm_api3('Setting', 'get', array(
    'domain_id' => $domainID,
    'return' => "quick_donation_page",
  ));
  $donatePageID = NULL;
  if (CRM_Utils_Array::value('is_error', $settings, FALSE) || empty($settings['values'][$domainID]['quick_donation_page'])) {
    if (CRM_Core_Permission::check('administer CiviCRM')) {
      CRM_Core_Session::setStatus('Donation form configuration is not done!', ts('Notice'), 'warning');
      CRM_Utils_System::redirect(CRM_Utils_System::url('civicrm/quick/donation/configuration'),'reset=1');
    }
    else {
      CRM_Core_Error::debug_var('setting-get result for quick_donation_page', $settings);
      CRM_Core_Error::fatal(ts('Donation page is not configures. Please contact site administrator.'));
    }
  }
  else {
    $donatePageID = $settings['values'][$domainID]['quick_donation_page'];
  }
  return $donatePageID;
}

/**
 * @param $angularModule
 */
function quickdonate_civicrm_angularModules(&$angularModule) {
  $session = CRM_Core_Session::singleton();
  $contactID = $session->get('userID');

  if ($donatePageID = quickdonate_getQuickDonateSetting()) {
    $extends = CRM_Core_Component::getComponentID('CiviContribute');
    $priceSetID = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $donatePageID, $extends);

    $priceField = civicrm_api3('PriceField', 'get', array("price_set_id" => $priceSetID));
    $otherAmount = FALSE;
    foreach($priceField['values'] as $key => $value) {
      if ($value['name'] == 'other_amount') {
        $otherAmount = TRUE;
      }
      else {
        $priceFieldVal = civicrm_api3('PriceFieldValue', 'get', array('return' => "amount, title, name, is_default","price_field_id"=> $value['id']));
        $priceList = $priceFieldVal['values'];
      }
    }
    $donateConfig = $donatePage = civicrm_api3('ContributionPage', 'getsingle', array(
      'id' => $donatePageID,
    ));

    $currencySymbol = CRM_Core_DAO::getFieldValue('CRM_Financial_DAO_Currency', $donatePage['currency'], 'symbol', 'name');
    $test = !empty($_GET['test']) ? 'test' : 'live';

    if (is_array($donatePage['payment_processor'])) {
      $paymentProcessors = CRM_Financial_BAO_PaymentProcessor::getPayments($donatePage['payment_processor'], $test);
    }
    else {
      $paymentProcessor = CRM_Financial_BAO_PaymentProcessor::getPayment($donatePage['payment_processor'], $test);
      $paymentProcessors[$paymentProcessor['id']] = $paymentProcessor;
    }
    $config = CRM_Core_Config::singleton();
    $defaultContactCountry = $config->defaultContactCountry;
    $stateProvince = array_flip(CRM_Core_PseudoConstant::stateProvinceForCountry($defaultContactCountry));
  }

  CRM_Core_Resources::singleton()->addSetting(array(
    'quickdonate' => array(
      'donatePageID' => $donatePageID,
      'priceSetID' => $priceSetID,
      'sessionContact' => $contactID,
      'currency' => $currencySymbol,
      'config' => $donateConfig,
      'paymentProcessor' => $paymentProcessors,
      'priceList' => $priceList,
      'otherAmount' => $otherAmount,
      'country' => $defaultContactCountry,
      'allStates' => $stateProvince,
      'isTest' => ($test == 'test') ? 1 : 0,
      'invoiceID' => md5(uniqid(rand(), TRUE))
    ),
  ));
  CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.quickdonate',  'css/bootstrap.min.css', 103, 'page-header');

  $angularModule['quickdonate'] = array(
    'ext' => 'com.webaccessglobal.quickdonate',
    'js' => array(
      'js/quickdonate.js',
      'js/parsley.min.js',
      'js/jquery.ziptastic.js',
      'js/bootstrap.min.js',
      'js/libs/modernizr.js',
      'js/libs/jquery.inputmask.js',
      'js/libs/jquery.inputmaskDate.extensions.js'
    ),
    'css' => array(
      'css/quickdonate.css'
    )
  );
}
