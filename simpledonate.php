<?php

require_once 'simpledonate.civix.php';

/**
 * Implementation of hook_civicrm_config
 */
function simpledonate_civicrm_config(&$config) {
  _simpledonate_civix_civicrm_config($config);
}

/**
 * Implementation of hook_civicrm_xmlMenu
 *
 * @param $files array(string)
 */
function simpledonate_civicrm_xmlMenu(&$files) {
  _simpledonate_civix_civicrm_xmlMenu($files);
}

/**
 * Implementation of hook_civicrm_install
 */
function simpledonate_civicrm_install() {
  //Add menu for donation page link under Contribution parent navigation
  //And Configuration link under Admin navigation
  $civiContributeParentId = CRM_Core_DAO::getFieldValue('CRM_Core_DAO_Navigation', 'CiviContribute', 'id', 'name');
  $params = array(
    'domain_id' => CRM_Core_Config::domainID(),
    'label'     => 'Simple Donate Configuration',
    'name'      => 'Simple Donate Configuration',
    'url'       => 'civicrm/simple/donation/configuration?reset=1',
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
    'label'     => 'Simple Donate',
    'name'      => 'Simple Donate',
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
      'label' => ts('Test mode'),
      'name' => 'Test Donation',
      'url'  => 'civicrm/simple?test=1#/donation',
      'permission' => 'access CiviContribute',
    ),
    array(
      'label' => ts('Live mode'),
      'name' => 'Live Donation',
      'url'  => 'civicrm/simple/#/donation',
      'permission' => 'access CiviContribute',
    ),
  );

  foreach ($donationMenuTree as $key => $menuItems) {
    $menuItems['is_active'] = 1;
    $menuItems['parent_id'] =  $donationNavigation->id;
    $menuItems['weight'] = $key;
    CRM_Core_BAO_Navigation::add($menuItems);
  }
  return _simpledonate_civix_civicrm_install();
}

/**
 * Implementation of hook_civicrm_uninstall
 */
function simpledonate_civicrm_uninstall() {
  $query = "DELETE FROM civicrm_navigation WHERE name in ('Simple Donate','Simple Donate Configuration')";
  CRM_Core_DAO::executeQuery($query);
  return _simpledonate_civix_civicrm_uninstall();
}

/**
 * Implementation of hook_civicrm_enable
 */
function simpledonate_civicrm_enable() {
  $sql = "UPDATE civicrm_navigation SET is_active=1 WHERE name IN ('Simple Donate Configuration', 'Simple Donate', 'Test Donation', 'Live Donation')";
  CRM_Core_DAO::executeQuery($sql);
  return _simpledonate_civix_civicrm_enable();
}

/**
 * Implementation of hook_civicrm_disable
 */
function simpledonate_civicrm_disable() {
  $sql = "UPDATE civicrm_navigation SET is_active=0 WHERE name IN ('Simple Donate Configuration', 'Simple Donate', 'Test Donation', 'Live Donation')";
  CRM_Core_DAO::executeQuery($sql);
  return _simpledonate_civix_civicrm_disable();
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
function simpledonate_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _simpledonate_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implementation of hook_civicrm_managed
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 */
function simpledonate_civicrm_managed(&$entities) {
  return _simpledonate_civix_civicrm_managed($entities);
}

/**
 * Implementation of hook_civicrm_caseTypes
 *
 * Generate a list of case-types
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 */
function simpledonate_civicrm_caseTypes(&$caseTypes) {
  _simpledonate_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implementation of hook_civicrm_alterSettingsFolders
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function simpledonate_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _simpledonate_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

function simpledonate_civicrm_pageRun(&$page) {
  $pageName = $page->getVar('_name');
  if ($pageName == 'Civi\Angular\Page\Main' && $page->urlPath[1] == 'simple') {
    //Get all contribution page detils and session details to be used in js
    $settingVal = simpledonate_getSimpleDonateSetting();
    $session = CRM_Core_Session::singleton();
    $contactID = $session->get('userID');
    if ($settingVal['donatePageID']) {
      $extends = CRM_Core_Component::getComponentID('CiviContribute');
      $priceSetID = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $settingVal['donatePageID'], $extends);
      $priceField = civicrm_api3('PriceField', 'get', array("price_set_id" => $priceSetID));
      //Check for is_quick_config
      $isQuickConfig = civicrm_api3('PriceSet', 'getvalue', array(
        'id' => $priceSetID,
        'return' => "is_quick_config",
      ));
      //Check for Other amount
      $otherAmount = FALSE;
      foreach($priceField['values'] as $key => $value) {
        if ($value['name'] == 'other_amount') {
          $otherAmount = TRUE;
        }
        else {
          $priceFieldVal = civicrm_api3('PriceFieldValue', 'get', array('return' => "amount, title, name, is_default","price_field_id"=> $value['id']));
          $priceList = $priceFieldVal['values'];
          $htmlPriceList[$value['html_type']] = $priceFieldVal['values'];
        }
      }
      //Get donation page details
      $donateConfig = $donatePage = civicrm_api3('ContributionPage', 'getsingle', array(
        'id' => $settingVal['donatePageID'],
      ));
      CRM_Utils_System::setTitle($donateConfig['title']); // Set the page title

      $currencySymbol = CRM_Core_DAO::getFieldValue('CRM_Financial_DAO_Currency', $donatePage['currency'], 'symbol', 'name');
      $test = !empty($_GET['test']) ? 'test' : 'live'; // Check for test or live donation

      //Get payment processor details
      if (is_array($donatePage['payment_processor'])) {
        $paymentProcessors = CRM_Financial_BAO_PaymentProcessor::getPayments($donatePage['payment_processor'], $test);
      }
      else {
        $paymentProcessor = CRM_Financial_BAO_PaymentProcessor::getPayment($donatePage['payment_processor'], $test);
        $paymentProcessors[$paymentProcessor['id']] = $paymentProcessor;
        $paymentProcessors[$paymentProcessor['id']]['hide'] = $donateConfig['is_pay_later'] ? FALSE : TRUE;
      }
      //set Country and State value
      $config = CRM_Core_Config::singleton();
      $defaultContactCountry = $config->defaultContactCountry;
      $stateProvince = array_flip(CRM_Core_PseudoConstant::stateProvinceForCountry($defaultContactCountry));
      $countryList = CRM_Core_PseudoConstant::country();
      $stateList = array();
      foreach($countryList as $key => $val) {
        $stateList[$key] = CRM_Core_PseudoConstant::stateProvinceForCountry($key);
      }

      CRM_Core_Resources::singleton()->addSetting(array(
        'simpledonate' => array(
          'sessionContact' => $contactID,
          'priceSetID' => $priceSetID,
          'ziptasticEnable' => $settingVal['ziptasticEnable'],
          'countryList' => CRM_Core_PseudoConstant::country(),
          'stateList' => $stateList,
          'country' => $defaultContactCountry,
          'allStates' => $stateProvince,
          'currency' => $currencySymbol,
          'config' => $donateConfig,
          'paymentProcessor' => $paymentProcessors,
          'priceList' => $priceList,
          'otherAmount' => $otherAmount,
          'isTest' => ($test == 'test') ? 1 : 0,
          'htmlPriceList' => $htmlPriceList,
          'isQuickConfig' => $isQuickConfig,
        ),
      ));
      //Include bootstrap and custom css files to affect this angular page only
      CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.simpledonate',  'css/bootstrap.min.css', 103, 'page-header');
      CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.simpledonate',  'css/simpledonate.css', 100, 'page-body');
    }

    if ($contactID) {
      $id = array('id' => $contactID);
      $result = civicrm_api3('Contact', 'getSingle', $id);
      CRM_Core_Resources::singleton()->addSetting(array(
        'simpledonateVal' => $result,
      ));
    }
  }
}

/**
 * get tab options from DB using setting-get api
 */
function simpledonate_getSimpleDonateSetting() {
  $settingVal = array();
  $donateId = CRM_Core_BAO_Setting::getItem('Simple Donation', 'simple_donation_page');
  if (empty($donateId)) {
    //Redirect to configuration page if user has permission
    if (CRM_Core_Permission::check('administer CiviCRM')) {
      CRM_Core_Session::setStatus('Simple donation configuration is incomplete!', ts('Incomplete configuration'), 'warning');
      CRM_Utils_System::redirect(CRM_Utils_System::url('civicrm/simple/donation/configuration','reset=1'));
    }
    else {
      CRM_Core_Error::debug_var('setting-get result for simple_donation_page', $settings);
      CRM_Core_Error::fatal(ts('Donation page is not configures. Please contact site administrator.'));
    }
  }
  else {
    $settingVal['donatePageID'] = $donateId;
    $settingVal['ziptasticEnable'] = CRM_Core_BAO_Setting::getItem('Simple Donation', 'ziptastic_enable');
  }
  return $settingVal;
}

/**
 * @param $angularModule
 */
function simpledonate_civicrm_angularModules(&$angularModule) {
  CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.simpledonate',  'css/bootstrap.min.css', 103, 'page-header');

  $angularModule['simpledonate'] = array(
    'ext' => 'com.webaccessglobal.simpledonate',
    'js' => array(
      'js/simpledonate.js',
      'js/libs/parsley.min.js',
      'js/libs/jquery.ziptastic.js',
      'js/libs/bootstrap.min.js',
      'js/libs/modernizr.js',
      'js/libs/jquery.inputmask.js',
      'js/libs/jquery.inputmaskDate.extensions.js'
    )
  );
}
