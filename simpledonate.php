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

function simpledonate_civicrm_navigationMenu(&$navMenu) {
  $pages = array(
    'admin_page' => array(
      'label'     => 'Simple Donation Pages',
      'name'      => 'Simple Donation Pages',
      'url'       => 'civicrm/simple/donation/pages?reset=1',
      'permission'=> 'access CiviContribute',
      'parent' => array('Contributions'),
      'operator'   => 'AND',
      'separator'  => NULL,
      'active'     => 1
    ),
    'settings_page' => array(
      'label'     => 'Simple Donate Configuration',
      'name'      => 'Simple Donate Configuration',
      'url'       => 'civicrm/simple/donation/configuration?reset=1',
      //'url'        => 'civicrm/admin/contribute/simpledonate',
      //'permission'=> 'access CiviContribute',
      'permission' => 'access CiviContribute,administer CiviCRM',
      'parent'    => array('Administer','CiviContribute'),
      'operator'   => 'AND',
      'separator'  => NULL,
      'active'     => 1
    ),
  );
  foreach($pages as $item) {
    // Check that our item doesn't already exist
    if (empty($item['url'])) {
      $menu_item_search = array('name' => $item['name']);
    } else {
      $menu_item_search = array('url' => $item['url']);
    }
    $menu_items = array();
    CRM_Core_BAO_Navigation::retrieve($menu_item_search, $menu_items);
    if (empty($menu_items)) {
      $path = implode('/',$item['parent']);
      unset($item['parent']);
      _simpledonate_civix_insert_navigation_menu($navMenu, $path, $item);
    }
  }
}
/**
 * Implementation of hook_civicrm_install
 */
function simpledonate_civicrm_install() {
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
  $session = CRM_Core_Session::singleton();
  $pageName = $page->getVar('_name');

  if ($pageName == 'Civi\Angular\Page\Main' && $page->urlPath[1] == 'simple') {
    //Get all contribution page detils and session details to be used in js
    $settingVal = CRM_SimpleDonate_Page_SimpleDonationPage::getSimpleDonateSetting();
    $settingVal['donatePageID'] = $session->get('pageId');
    $session = CRM_Core_Session::singleton();
    $tempID = CRM_Utils_Request::retrieve('cid', 'Positive');
    //check if this is a checksum authentication
    $userChecksum = CRM_Utils_Request::retrieve('cs', 'String');
    if ($userChecksum) {
      //check for anonymous user.
      $validUser = CRM_Contact_BAO_Contact_Utils::validChecksum($tempID, $userChecksum);
      if ($validUser) {
        $contactID = $tempID;
      }
    } else {
    $contactID = $session->get('userID');
    }
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
          $priceFieldVal = civicrm_api3('PriceFieldValue', 'get', array('return' => "amount, title, name, is_default","price_field_id"=> $value['id'], 'is_active' => 1));
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

      // Check for test or live donation
      if (!empty($page->urlPath[2]) && $page->urlPath[2] === 'test') {
        $test = 'test';
      }
      else {
        $test = 'live';
      }

      //Get donation page details
      $donateConfig = $donatePage = civicrm_api3('ContributionPage', 'getsingle', array(
        'id' => $settingVal['donatePageID'],
      ));
      CRM_Utils_System::setTitle($donateConfig['title']); // Set the page title

      $currencySymbol = CRM_Core_DAO::getFieldValue('CRM_Financial_DAO_Currency', $donatePage['currency'], 'symbol', 'name');

      $paymentProcessors = simpledonate_civicrm_get_payment_processors($donatePage['payment_processor'], $test, $donateConfig);
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
          'priceList' => empty($priceList) ? NULL : $priceList,
          'otherAmount' => $otherAmount,
          'isTest' => ($test == 'test') ? 1 : 0,
          'htmlPriceList' => empty($priceList) ? NULL :$htmlPriceList,
          'isQuickConfig' => $isQuickConfig,
          'donatePageId' => $settingVal['donatePageID'],
        ),
      ));
      //Include bootstrap and custom css files to affect this angular page only
      CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.simpledonate',  'css/bootstrap.min.css', 103, 'page-header');
      CRM_Core_Resources::singleton()->addStyleFile('com.webaccessglobal.simpledonate',  'css/simpledonate.css', 100, 'page-body');
      CRM_Core_Resources::singleton()->addScriptFile('com.webaccessglobal.simpledonate',  'js/libs/bootstrap.min.js', 100, 'html-header');
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
 * @param $angularModule
 */
function simpledonate_civicrm_angularModules(&$angularModule) {
  $angularModule['simpledonate'] = array(
    'ext' => 'com.webaccessglobal.simpledonate',
    'js' => array(
      'js/simpledonate.js',
      'js/libs/parsley.min.js',
      'js/libs/jquery.ziptastic.js',
      'js/libs/modernizr.js',
      //'js/libs/jquery.inputmask.js',
      'js/libs/jquery.inputmask.bundle.min.js',
      //'js/libs/jquery.inputmaskDate.extensions.js',
    )
  );
}

/**
 * Get live and/or test payment processor based on live paymentProcessorId.
 * Fixes bugs in civicrm getPayment function.
 *
 * Passing test to getPayment will always return NULL to CiviCRM bug.
 *
 * PaymentProcessor Ids via the Donate Page Config are always live.
 *
 * Deal with getting the test processor during transaction processing.
 *
 * @param $paymentProcessorIds
 * @param $mode
 * @param $donateConfig
 */
function simpledonate_civicrm_get_payment_processors($paymentProcessorIDs, $mode, $donateConfig) {
  //Get payment processor details
  if (!$paymentProcessorIDs) {
    CRM_Core_Error::fatal(ts('Invalid value passed to getPayment function'));
  }

  if (is_array($paymentProcessorIDs)) {
    $payments = array( );
    foreach ($paymentProcessorIDs as $paymentProcessorID) {
      $payment = CRM_Financial_BAO_PaymentProcessor::getPayment($paymentProcessorID);
      $payments[$payment['id']] = $payment;
    }

    asort($payments);
    $paymentProcessors = $payments;
  }
  else {
    $paymentProcessor = CRM_Financial_BAO_PaymentProcessor::getPayment($paymentProcessorIDs);
    $paymentProcessors[$paymentProcessor['id']] = $paymentProcessor;
    $paymentProcessors[$paymentProcessor['id']]['hide'] = $donateConfig['is_pay_later'] ? FALSE : TRUE;
  }

  //Only use paymentProcessors of billing_mode type FORM
  foreach ($paymentProcessors as $id => $payment) {
    if ($payment['billing_mode'] != CRM_Core_Payment::BILLING_MODE_FORM) {
      unset ($paymentProcessors[$id]);
    }
  }

  return $paymentProcessors;
}

